package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.dto.audit.AuditDetails;
import com.minexpert.hns.dto.audit.AuditRequest;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.PlanningStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditRepository auditRepository;
    private final AuditorService auditorService;

    private final ContributorService contributorService;

    // LOT 53 — dépendances du verrouillage de clôture ISO 19011 §6.6
    private final com.minexpert.hns.repository.audit.ReportRepository reportRepository;
    private final com.minexpert.hns.repository.audit.AuditChecklistItemRepository checklistItemRepository;
    private final com.minexpert.hns.repository.audit.ObservationRepository observationRepository;
    private final com.minexpert.hns.repository.audit.MeetingRepository meetingRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public Long createAudit(AuditDTO auditDTO) throws HSException {
        auditDTO.setRefNumber(generateAuditRefNumber());
        auditDTO.setStatus(AuditStatus.PLANNING);
        auditDTO.setCreatedAt(LocalDateTime.now());
        auditDTO.setUpdatedAt(LocalDateTime.now());
        return auditRepository.save(auditDTO.toEntity()).getId();

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#auditDTO.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#auditDTO.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAudit(AuditDTO auditDTO) throws HSException {
        Audit audit = auditRepository.findById(auditDTO.getId())
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        auditRepository.save(audit.update(auditDTO));
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id")
    public AuditDTO getAudit(Long id) throws HSException {
        return auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public Long createAudit(AuditRequest request) throws HSException {
        Long auditId = this.createAudit(request.getAudit());
        auditorService.addAuditors(request.getAuditors(), auditId);
        return auditId;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#request.audit.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#request.audit.id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAudit(AuditRequest request) throws HSException {
        this.updateAudit(request.getAudit());
        auditorService.addOrUpdateAuditors(request.getAuditors(), request.getAudit().getId());

    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_LIST)
    public List<AuditDTO> getAllAudits() throws HSException {
        return ((List<Audit>) auditRepository.findAll()).stream()
                .filter((x) -> x.getPlanningStatus() == null || x.getPlanningStatus() == PlanningStatus.APPROVED)
                .map(Audit::toDTO)
                .toList();
    }

    @Override
    public void executeAudit(ExecuteRequest request) throws HSException {
        // reportService.createReport(request.getReport());
        contributorService.createContributors(request.getContributors());
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id")
    public AuditDetails getAuditDetails(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        return audit.toDTO().toDetails();
    }

    private String generateAuditRefNumber() {
        int currentYear = Year.now().getValue();

        // Fetch last incident for the current year
        Pageable limitOne = PageRequest.of(0, 1);
        List<Audit> latestAudits = auditRepository.findTopByYearOrderByIdDesc(currentYear, limitOne);

        int nextNumber = 1;
        if (!latestAudits.isEmpty()) {
            String lastNumber = latestAudits.get(0).getRefNumber(); // INC-2025-000123
            if (lastNumber != null) {
                String[] parts = lastNumber.split("-");
                if (parts.length == 3) {
                    nextNumber = Integer.parseInt(parts[2]) + 1;
                }
            }
        }

        return String.format("AUD-%d-%03d", currentYear, nextNumber);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void updateAuditStatus(Long id, AuditStatus status) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        if (status == AuditStatus.CLOSED) {
            assertReadyForClosure(id);
        }
        audit.setStatus(status);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    /**
     * LOT 53 — verrouillage de clôture ISO 19011 §6.6 : un audit n'est terminé
     * que lorsque les activités du plan sont achevées et le rapport approuvé.
     * Chaque condition violée est signalée par un code d'erreur dédié :
     *   1. rapport d'audit existant et APPROUVÉ (§6.5) ;
     *   2. checklist entièrement évaluée — aucun item A_EVALUER (§6.4.7) ;
     *   3. tous les constats classés selon ISO (§6.4.8 — plus de constat « non classé ») ;
     *   4. toute non-conformité (majeure/mineure) escaladée vers les Constats
     *      centraux pour garantir le suivi des actions (§6.7) ;
     *   5. réunions d'ouverture ET de clôture enregistrées (§6.4.2 / §6.4.9).
     */
    private void assertReadyForClosure(Long auditId) throws HSException {
        var report = reportRepository.findByAudit_Id(auditId).orElse(null);
        if (report == null || report.getStatus() != com.minexpert.hns.enums.AuditReportStatus.APPROVED) {
            throw new HSException("CLOSURE_REQUIRES_APPROVED_REPORT");
        }

        boolean checklistIncomplete = checklistItemRepository
                .findByAuditIdOrderByReferentialAscIdAsc(auditId).stream()
                .anyMatch(item -> "A_EVALUER".equals(item.getResult()));
        if (checklistIncomplete) {
            throw new HSException("CLOSURE_REQUIRES_COMPLETED_CHECKLIST");
        }

        var observations = observationRepository.findByAudit_Id(auditId);
        if (observations.stream().anyMatch(o -> o.getClassification() == null || o.getClassification().isBlank())) {
            throw new HSException("CLOSURE_REQUIRES_CLASSIFIED_FINDINGS");
        }
        if (observations.stream().anyMatch(o -> o.getClassification() != null
                && o.getClassification().startsWith("NC_") && o.getNonConformityId() == null)) {
            throw new HSException("CLOSURE_REQUIRES_ESCALATED_NC");
        }

        var meetings = meetingRepository.findByAudit_Id(auditId);
        boolean hasOpening = meetings.stream().anyMatch(m -> "OPENING".equals(m.getType()));
        boolean hasClosing = meetings.stream().anyMatch(m -> "CLOSING".equals(m.getType()));
        if (!hasOpening || !hasClosing) {
            throw new HSException("CLOSURE_REQUIRES_OPENING_AND_CLOSING_MEETINGS");
        }
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST)
    public List<AuditDTO> getAllPlanningAudits() throws HSException {
        return auditRepository.findAllWithNonNullPlanningStatus().stream().map(Audit::toDTO).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void approvePlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.APPROVED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_LIST, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AUDIT_PLANNING_LIST, allEntries = true)
    })
    public void rejectPlanning(Long id) throws HSException {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        audit.setPlanningStatus(PlanningStatus.REJECTED);
        audit.setUpdatedAt(LocalDateTime.now());
        auditRepository.save(audit);
    }

}
