package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.OverexposureCaseDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.CaseStatus;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OverexposureCaseServiceImpl implements OverexposureCaseService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OverexposureCaseServiceImpl.class);

    private static final List<CaseStatus> ACTIVE_STATUSES = Arrays.asList(
            CaseStatus.OPEN, CaseStatus.INVESTIGATING);

    private final OverexposureCaseRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    /**
     * Phase 7 - injection optionnelle (setter pour permettre l'instanciation par les tests
     * unitaires Mockito sans dependance circulaire). Si present, on declenche
     * l'auto-planification d'une visite POST_EXPOSURE a l'ouverture d'un dossier.
     */
    private MedicalVisitService medicalVisitService;

    @Autowired(required = false)
    public void setMedicalVisitService(MedicalVisitService medicalVisitService) {
        this.medicalVisitService = medicalVisitService;
    }

    @Override
    public Long create(Long companyId, OverexposureCaseDTO dto) {
        OverexposureCase e = toEntity(dto);
        LocalDateTime now = LocalDateTime.now();
        if (e.getOpenedAt() == null) e.setOpenedAt(now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        OverexposureCase saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy(), null);
        return saved.getId();
    }

    @Override
    public void update(Long companyId, OverexposureCaseDTO dto) {
        OverexposureCase existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + dto.getId()));
        existing.setLevel(dto.getLevel());
        existing.setAlertId(dto.getAlertId());
        existing.setCause(dto.getCause());
        existing.setCorrectiveActions(dto.getCorrectiveActions());
        existing.setMedicalDecision(dto.getMedicalDecision());
        existing.setAuthorityDeclaration(dto.isAuthorityDeclaration());
        existing.setAuthorityDeclarationDate(dto.getAuthorityDeclarationDate());
        existing.setStatus(dto.getStatus());
        existing.setClosedAt(dto.getClosedAt());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(dto.getUpdatedBy());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy(), null);
    }

    @Override
    public List<OverexposureCaseDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public OverexposureCaseDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null, null);
    }

    // ----------------------------------------------------------------------------
    // Phase 5 — workflow OPEN -> INVESTIGATING -> CLOSED.
    // ----------------------------------------------------------------------------

    /**
     * Ouverture d'un dossier. Garde-fou anti-doublon : si {@code alertId} est non null, on
     * verifie qu'il n'existe pas deja un case OPEN ou INVESTIGATING pour cet alertId
     * (un meme depassement = un seul dossier d'investigation).
     */
    @Override
    @Transactional
    public Long openCase(Long workerId, Long alertId, Long openedBy, String cause, AlertLevel level) {
        if (alertId != null) {
            List<OverexposureCase> existing = repository
                    .findByAlertIdAndStatusIn(alertId, ACTIVE_STATUSES);
            if (!existing.isEmpty()) {
                throw new IllegalStateException(
                        "OverexposureCase already open or investigating for alertId=" + alertId
                                + " (existing caseId=" + existing.get(0).getId() + ")");
            }
        }
        ExposedWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + workerId));
        LocalDateTime now = LocalDateTime.now();
        OverexposureCase c = OverexposureCase.builder()
                .worker(worker)
                .alertId(alertId)
                .level(level)
                .cause(cause)
                .authorityDeclaration(false)
                .status(CaseStatus.OPEN)
                .openedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .createdBy(openedBy)
                .updatedBy(openedBy)
                .build();
        OverexposureCase saved = repository.save(c);
        audit("OPEN_OVEREXPOSURE", saved.getId(), openedBy,
                String.format("{\"workerId\":%d,\"alertId\":%s,\"level\":\"%s\"}",
                        workerId, alertId != null ? alertId.toString() : "null",
                        level != null ? level.name() : "null"));
        // Phase 7 - auto-planification de la visite POST_EXPOSURE (J+7). Idempotent cote
        // service (skip si une visite POST_EXPOSURE SCHEDULED existe deja).
        if (medicalVisitService != null) {
            try {
                Long visitId = medicalVisitService.autoSchedulePostExposureVisit(workerId,
                        worker.getMineId(), openedBy);
                if (visitId != null) {
                    LOGGER.info("[OverexposureCase] Auto-scheduled POST_EXPOSURE visitId={} "
                            + "for workerId={} (caseId={})", visitId, workerId, saved.getId());
                }
            } catch (Exception ex) {
                // Best-effort : echec de planification ne doit pas bloquer l'ouverture du
                // dossier. On trace en audit pour retry manuel ulterieur.
                LOGGER.error("[OverexposureCase] Auto-schedule POST_EXPOSURE visit FAILED "
                        + "for caseId={}, workerId={}: {}", saved.getId(), workerId,
                        ex.getMessage(), ex);
                audit("AUTO_SCHEDULE_POST_EXPOSURE_FAILED", saved.getId(), openedBy,
                        String.format("{\"workerId\":%d,\"error\":\"%s\"}",
                                workerId, escapeJson(ex.getMessage())));
            }
        }
        return saved.getId();
    }

    @Override
    @Transactional
    public void addInvestigation(Long caseId, String correctiveActions, String medicalDecision,
            Long actorId) {
        OverexposureCase c = repository.findById(caseId)
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + caseId));
        if (c.getStatus() != CaseStatus.OPEN && c.getStatus() != CaseStatus.INVESTIGATING) {
            throw new IllegalStateException(
                    "Invalid transition: INVESTIGATE only allowed from OPEN or INVESTIGATING (current="
                            + c.getStatus() + ")");
        }
        c.setStatus(CaseStatus.INVESTIGATING);
        if (correctiveActions != null) c.setCorrectiveActions(correctiveActions);
        if (medicalDecision != null) c.setMedicalDecision(medicalDecision);
        c.setUpdatedAt(LocalDateTime.now());
        c.setUpdatedBy(actorId);
        repository.save(c);
        audit("INVESTIGATE", caseId, actorId, null);
    }

    @Override
    @Transactional
    public void closeCase(Long caseId, boolean authorityDeclaration, Long actorId,
            String closureNote) {
        OverexposureCase c = repository.findById(caseId)
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + caseId));
        if (c.getStatus() != CaseStatus.OPEN && c.getStatus() != CaseStatus.INVESTIGATING) {
            throw new IllegalStateException(
                    "Invalid transition: CLOSE only allowed from OPEN or INVESTIGATING (current="
                            + c.getStatus() + ")");
        }
        LocalDateTime now = LocalDateTime.now();
        c.setStatus(CaseStatus.CLOSED);
        c.setClosedAt(now);
        c.setAuthorityDeclaration(authorityDeclaration);
        if (authorityDeclaration && c.getAuthorityDeclarationDate() == null) {
            c.setAuthorityDeclarationDate(LocalDate.now());
        }
        c.setUpdatedAt(now);
        c.setUpdatedBy(actorId);
        repository.save(c);
        String details = String.format("{\"authorityDeclaration\":%s,\"note\":\"%s\"}",
                authorityDeclaration, escapeJson(closureNote != null ? closureNote : ""));
        audit("CLOSE_OVEREXPOSURE", caseId, actorId, details);
    }

    @Override
    public List<OverexposureCaseDTO> findByWorker(Long workerId) {
        return repository.findByWorkerId(workerId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<OverexposureCaseDTO> findActive(Long mineId) {
        return repository.findActiveByMineId(mineId, ACTIVE_STATUSES).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    private void audit(String action, Long entityId, Long userId, String details) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("OverexposureCase").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now())
                .details(details).build());
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }

    private OverexposureCase toEntity(OverexposureCaseDTO dto) {
        OverexposureCase e = new OverexposureCase();
        e.setId(dto.getId());
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(w);
        e.setLevel(dto.getLevel());
        e.setAlertId(dto.getAlertId());
        e.setCause(dto.getCause());
        e.setCorrectiveActions(dto.getCorrectiveActions());
        e.setMedicalDecision(dto.getMedicalDecision());
        e.setAuthorityDeclaration(dto.isAuthorityDeclaration());
        e.setAuthorityDeclarationDate(dto.getAuthorityDeclarationDate());
        e.setStatus(dto.getStatus());
        e.setOpenedAt(dto.getOpenedAt());
        e.setClosedAt(dto.getClosedAt());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private OverexposureCaseDTO toDTO(OverexposureCase e) {
        return new OverexposureCaseDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getLevel(), e.getAlertId(), e.getCause(), e.getCorrectiveActions(),
                e.getMedicalDecision(), e.isAuthorityDeclaration(),
                e.getAuthorityDeclarationDate(), e.getStatus(),
                e.getOpenedAt(), e.getClosedAt(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
