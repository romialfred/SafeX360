package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DoseRecordCreateResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordSupersedeRequestDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service DoseRecord.
 *
 * <p>Append-only : aucune mutation directe des valeurs metier d'un record existant. Toute
 * correction passe par {@link #supersede(Long, DoseRecordDTO)} ou
 * {@link #supersedeWithResult(Long, DoseRecordSupersedeRequestDTO)} qui creent une NOUVELLE
 * version (version + 1) et chainent l'ancien via supersededRecordId. Seule la colonne
 * superseded_record_id est mutable (cf. trigger V004 + JPA updatable=false sur les autres).
 *
 * <p>PHASE 4 : les methodes enrichies (createWithResult / supersedeWithResult) declenchent en
 * cascade dans la meme transaction (sauf recompute qui est REQUIRES_NEW pour isolation) :
 * <ol>
 *   <li>persistence du record</li>
 *   <li>recalcul du DoseCumulative (annual / 5y / lifetime) via {@link DoseCumulativeCalculator}</li>
 *   <li>evaluation des seuils et creation d'alertes via {@link ThresholdEngine}</li>
 *   <li>audit log (CREATE / SUPERSEDE)</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class DoseRecordServiceImpl implements DoseRecordService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DoseRecordServiceImpl.class);

    /** Seuils de safety nominatifs pour le flag requiresDoubleValidation (en mSv). */
    private static final double DOUBLE_VALIDATION_HP10_MSV = 10.0;
    private static final double DOUBLE_VALIDATION_HP007_MSV = 100.0;
    private static final double DOUBLE_VALIDATION_HP3_MSV = 10.0;

    private final DoseRecordRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;
    private final DoseCumulativeCalculator cumulativeCalculator;
    private final ThresholdEngine thresholdEngine;
    private final DosimetryAuditService auditService;

    // -----------------------------------------------------------------------------------------
    //   API LEGACY
    // -----------------------------------------------------------------------------------------

    @Override
    @Transactional
    public Long create(Long companyId, DoseRecordDTO dto) {
        return createWithResult(companyId, dto).getRecordId();
    }

    @Override
    @Transactional
    public Long supersede(Long companyId, DoseRecordDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("id required to supersede a DoseRecord");
        }
        // On reconstruit un SupersedeRequestDTO a partir du DTO legacy pour reutiliser la
        // logique enrichie (verification chainage scelle + recompute + alertes + audit).
        DoseRecordSupersedeRequestDTO request = new DoseRecordSupersedeRequestDTO();
        request.setOriginalId(dto.getId());
        request.setReason("Legacy supersede (no reason provided)");
        request.setWorkerId(dto.getWorkerId());
        request.setPeriod(dto.getPeriod());
        request.setHp10(dto.getHp10());
        request.setHp007(dto.getHp007());
        request.setHp3(dto.getHp3());
        request.setSource(dto.getSource());
        request.setBelowDetection(dto.isBelowDetection());
        request.setAttachmentUrls(dto.getAttachmentUrls());
        request.setNotes(dto.getNotes());
        request.setActorId(dto.getUpdatedBy());
        return supersedeWithResult(companyId, request).getRecordId();
    }

    @Override
    public List<DoseRecordDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DoseRecordDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DoseRecord not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        // AIEA GSR Part 3 §3.106 - les enregistrements de dose individuelle sont append-only :
        // toute correction passe par supersede() (creation d'une nouvelle version, l'ancien
        // record est marque via supersededRecordId). Une suppression effacerait la chaine d'audit.
        throw new UnsupportedOperationException(
                "DoseRecord delete forbidden by AIEA GSR Part 3 §3.106. Use supersede() to correct a record.");
    }

    @Override
    public List<DoseRecordDTO> getActiveByWorkerId(Long workerId) {
        return repository.findActiveByWorkerId(workerId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------------------------
    //   API ENRICHIE PHASE 4
    // -----------------------------------------------------------------------------------------

    @Override
    @Transactional
    public DoseRecordCreateResultDTO createWithResult(Long companyId, DoseRecordDTO dto) {
        // 1. Verifie qu'aucun DoseRecord ACTIF n'existe deja pour (worker, period).
        Optional<DoseRecord> existing = repository.findActiveByWorkerIdAndPeriod(
                dto.getWorkerId(), dto.getPeriod());
        if (existing.isPresent()) {
            throw new IllegalStateException(
                    "Use supersede() to correct existing dose record for this period");
        }

        // 2. Build + persist (version = 1, no supersede).
        DoseRecord e = toEntity(dto);
        e.setVersion(1);
        e.setSupersededRecordId(null);
        LocalDateTime now = LocalDateTime.now();
        e.setRecordedAt(dto.getRecordedAt() != null ? dto.getRecordedAt() : now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        DoseRecord saved = repository.save(e);

        // 3. Recompute cumul (REQUIRES_NEW dans le calculator -> isolation).
        int year = extractYear(saved.getPeriod());
        try {
            cumulativeCalculator.recompute(saved.getWorker().getId(), year);
        } catch (Exception ex) {
            LOGGER.error("[DoseRecordService] cumul recompute FAILED for worker={} year={} : {}",
                    saved.getWorker().getId(), year, ex.getMessage(), ex);
        }

        // 4. Threshold engine - cree les alertes ExposureAlert applicables.
        List<ExposureAlert> alerts;
        try {
            alerts = thresholdEngine.evaluateAndCreateAlerts(saved);
        } catch (Exception ex) {
            LOGGER.error("[DoseRecordService] threshold engine FAILED for record={} : {}",
                    saved.getId(), ex.getMessage(), ex);
            alerts = List.of();
        }

        // 5. Audit log (CREATE).
        audit("CREATE", saved.getId(), dto.getRecordedBy());
        if (auditService != null) {
            String details = String.format(
                    "{\"workerId\":%d,\"period\":\"%s\",\"version\":1,\"alertsCreated\":%d}",
                    saved.getWorker().getId(), saved.getPeriod(), alerts.size());
            auditService.log("CREATE", "DoseRecord", saved.getId(),
                    dto.getRecordedBy() != null ? dto.getRecordedBy() : 0L, null, details);
        }

        // 6. Flag double validation.
        boolean requiresDoubleValidation = requiresDoubleValidation(saved);

        return DoseRecordCreateResultDTO.builder()
                .recordId(saved.getId())
                .version(saved.getVersion())
                .requiresDoubleValidation(requiresDoubleValidation)
                .alertsCreated(alerts.size())
                .build();
    }

    @Override
    @Transactional
    public DoseRecordCreateResultDTO supersedeWithResult(Long companyId,
            DoseRecordSupersedeRequestDTO request) {
        if (request == null || request.getOriginalId() == null) {
            throw new IllegalArgumentException("originalId required to supersede a DoseRecord");
        }

        // 1. Verifie que l'original existe et n'est PAS deja superseded (chainage scelle).
        DoseRecord previous = repository.findById(request.getOriginalId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "DoseRecord not found: " + request.getOriginalId()));
        if (previous.getSupersededRecordId() != null) {
            throw new IllegalStateException(
                    "DoseRecord " + previous.getId() + " is already superseded (chain sealed). "
                            + "Supersede the latest version instead.");
        }

        // 2. Cree le nouveau record avec version + 1.
        DoseRecord next = new DoseRecord();
        ExposedWorker w = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Worker not found: " + request.getWorkerId()));
        next.setWorker(w);
        next.setPeriod(request.getPeriod());
        next.setHp10(request.getHp10());
        next.setHp007(request.getHp007());
        next.setHp3(request.getHp3());
        next.setSource(request.getSource());
        next.setBelowDetection(request.isBelowDetection());
        next.setAttachmentUrls(request.getAttachmentUrls());
        next.setNotes(request.getNotes());
        next.setRecordedBy(request.getActorId() != null ? request.getActorId() : 0L);
        LocalDateTime now = LocalDateTime.now();
        next.setRecordedAt(now);
        next.setVersion(previous.getVersion() + 1);
        next.setSupersededRecordId(null);
        next.setCreatedAt(now);
        next.setUpdatedAt(now);
        next.setCreatedBy(request.getActorId());
        next.setUpdatedBy(request.getActorId());
        DoseRecord saved = repository.save(next);

        // 3. Met a jour UNIQUEMENT superseded_record_id de l'original (colonne mutable autorisee
        //    par le trigger V004). On utilise un UPDATE cible pour eviter qu'Hibernate ne tente
        //    de re-pousser d'autres colonnes.
        int updated = repository.updateSupersededRecordId(previous.getId(), saved.getId());
        if (updated != 1) {
            throw new IllegalStateException(
                    "Failed to chain superseded_record_id for original=" + previous.getId()
                            + " (rows updated=" + updated + ")");
        }

        // 4. Recompute cumul.
        int year = extractYear(saved.getPeriod());
        try {
            cumulativeCalculator.recompute(saved.getWorker().getId(), year);
        } catch (Exception ex) {
            LOGGER.error("[DoseRecordService] cumul recompute FAILED for worker={} year={} : {}",
                    saved.getWorker().getId(), year, ex.getMessage(), ex);
        }

        // 5. Threshold engine.
        List<ExposureAlert> alerts;
        try {
            alerts = thresholdEngine.evaluateAndCreateAlerts(saved);
        } catch (Exception ex) {
            LOGGER.error("[DoseRecordService] threshold engine FAILED for record={} : {}",
                    saved.getId(), ex.getMessage(), ex);
            alerts = List.of();
        }

        // 6. Audit log (SUPERSEDE).
        audit("UPDATE", saved.getId(), request.getActorId());
        if (auditService != null) {
            String details = String.format(
                    "{\"originalId\":%d,\"newId\":%d,\"reason\":%s,\"version\":%d}",
                    previous.getId(), saved.getId(),
                    quoteJson(request.getReason()), saved.getVersion());
            auditService.log("SUPERSEDE", "DoseRecord", saved.getId(),
                    request.getActorId() != null ? request.getActorId() : 0L, null, details);
        }

        boolean requiresDoubleValidation = requiresDoubleValidation(saved);

        return DoseRecordCreateResultDTO.builder()
                .recordId(saved.getId())
                .version(saved.getVersion())
                .requiresDoubleValidation(requiresDoubleValidation)
                .alertsCreated(alerts.size())
                .build();
    }

    // -----------------------------------------------------------------------------------------
    //   HELPERS
    // -----------------------------------------------------------------------------------------

    /** Extrait l'annee depuis une periode "YYYY-MM", "YYYY-Qx" ou "YYYY". */
    static int extractYear(String period) {
        if (period == null || period.length() < 4) {
            return LocalDateTime.now().getYear();
        }
        try {
            return Integer.parseInt(period.substring(0, 4));
        } catch (NumberFormatException ex) {
            return LocalDateTime.now().getYear();
        }
    }

    /** Vrai si une des valeurs depasse un seuil de safety nominatif. */
    private boolean requiresDoubleValidation(DoseRecord r) {
        if (r.getHp10() != null && r.getHp10() > DOUBLE_VALIDATION_HP10_MSV) return true;
        if (r.getHp007() != null && r.getHp007() > DOUBLE_VALIDATION_HP007_MSV) return true;
        if (r.getHp3() != null && r.getHp3() > DOUBLE_VALIDATION_HP3_MSV) return true;
        return false;
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("DoseRecord").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    /** Quote rapide d'une chaine pour JSON (echappe les " et \). */
    private String quoteJson(String raw) {
        if (raw == null) return "null";
        String escaped = raw.replace("\\", "\\\\").replace("\"", "\\\"");
        return "\"" + escaped + "\"";
    }

    private DoseRecord toEntity(DoseRecordDTO dto) {
        DoseRecord e = new DoseRecord();
        e.setId(dto.getId());
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(w);
        e.setPeriod(dto.getPeriod());
        e.setHp10(dto.getHp10());
        e.setHp007(dto.getHp007());
        e.setHp3(dto.getHp3());
        e.setSource(dto.getSource());
        e.setBelowDetection(dto.isBelowDetection());
        e.setAttachmentUrls(dto.getAttachmentUrls());
        e.setNotes(dto.getNotes());
        e.setRecordedBy(dto.getRecordedBy() != null ? dto.getRecordedBy() : 0L);
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private DoseRecordDTO toDTO(DoseRecord e) {
        return new DoseRecordDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriod(), e.getHp10(), e.getHp007(), e.getHp3(), e.getSource(),
                e.isBelowDetection(), e.getAttachmentUrls(), e.getNotes(),
                e.getRecordedBy(), e.getRecordedAt(), e.getVersion(), e.getSupersededRecordId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
