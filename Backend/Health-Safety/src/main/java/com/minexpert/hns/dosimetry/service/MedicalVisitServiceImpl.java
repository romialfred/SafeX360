package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MedicalVisitFullDTO;
import com.minexpert.hns.dosimetry.dto.MedicalVisitSummaryDTO;
import com.minexpert.hns.dosimetry.entity.MedicalVisit;
import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;
import com.minexpert.hns.dosimetry.repository.MedicalVisitRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation de {@link MedicalVisitService}.
 *
 * <p><b>RBAC :</b> les controllers gatent l'acces par {@code @PreAuthorize}. Cette couche
 * service applique en plus :
 * <ul>
 *   <li>la validation de coherence des transitions (SCHEDULED -&gt; PERFORMED uniquement) ;</li>
 *   <li>l'audit systematique de toute lecture ou ecriture de {@code detailedReport}
 *       (action {@code VIEW_MEDICAL_DETAIL} avec actorId + reason + ipAddress) ;</li>
 *   <li>la conversion appropriee FULL vs SUMMARY selon la methode appelee ; jamais de
 *       cross-leak vers un DTO Summary par accident (DTO separes).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MedicalVisitServiceImpl implements MedicalVisitService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MedicalVisitServiceImpl.class);

    /** Delai par defaut entre l'ouverture d'un OverexposureCase et la visite POST_EXPOSURE. */
    static final int POST_EXPOSURE_DELAY_DAYS = 7;

    private final MedicalVisitRepository repository;
    private final DosimetryAuditService auditService;

    // ----------------------------------------------------------------------------
    // Ecritures.
    // ----------------------------------------------------------------------------

    @Override
    public Long scheduleVisit(Long workerId, Long mineId, MedicalVisitType type,
            LocalDate scheduledDate, Long physicianId, String physicianName, Long createdBy) {
        if (workerId == null || mineId == null || type == null || scheduledDate == null
                || physicianId == null) {
            throw new IllegalArgumentException("workerId, mineId, type, scheduledDate, physicianId "
                    + "are required");
        }
        LocalDateTime now = LocalDateTime.now();
        MedicalVisit v = MedicalVisit.builder()
                .workerId(workerId)
                .mineId(mineId)
                .visitType(type)
                .scheduledDate(scheduledDate)
                .physicianId(physicianId)
                .physicianName(physicianName)
                .status(VisitStatus.SCHEDULED)
                .createdAt(now)
                .createdBy(createdBy)
                .updatedAt(now)
                .updatedBy(createdBy)
                .build();
        MedicalVisit saved = repository.save(v);
        auditService.log("SCHEDULE_MEDICAL_VISIT", "MedicalVisit", saved.getId(),
                createdBy != null ? createdBy : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL,
                String.format("{\"workerId\":%d,\"type\":\"%s\",\"scheduledDate\":\"%s\"}",
                        workerId, type.name(), scheduledDate));
        return saved.getId();
    }

    @Override
    public void performVisit(Long visitId, String generalConclusion, String detailedReport,
            LocalDate performedDate, Long performedBy, String ipAddress) {
        MedicalVisit v = repository.findById(visitId)
                .orElseThrow(() -> new EntityNotFoundException("MedicalVisit not found: " + visitId));
        if (v.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalStateException("PERFORM only allowed from SCHEDULED (current="
                    + v.getStatus() + ")");
        }
        if (performedDate == null) {
            throw new IllegalArgumentException("performedDate is required");
        }
        v.setStatus(VisitStatus.PERFORMED);
        v.setPerformedDate(performedDate);
        v.setGeneralConclusion(generalConclusion);
        v.setDetailedReport(detailedReport);
        v.setUpdatedAt(LocalDateTime.now());
        v.setUpdatedBy(performedBy);
        repository.save(v);
        // Audit specifique : tout enregistrement d'un detailedReport est une operation
        // MEDICAL trace separement pour faciliter les revues RGPD.
        auditService.log("PERFORM_MEDICAL_VISIT", "MedicalVisit", visitId,
                performedBy != null ? performedBy : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"performedDate\":\"%s\",\"hasDetailedReport\":%s}",
                        performedDate, detailedReport != null && !detailedReport.isBlank()));
    }

    @Override
    public void cancelVisit(Long visitId, String reason, Long actorId) {
        MedicalVisit v = repository.findById(visitId)
                .orElseThrow(() -> new EntityNotFoundException("MedicalVisit not found: " + visitId));
        if (v.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalStateException("CANCEL only allowed from SCHEDULED (current="
                    + v.getStatus() + ")");
        }
        v.setStatus(VisitStatus.CANCELLED);
        v.setCancellationReason(reason);
        v.setUpdatedAt(LocalDateTime.now());
        v.setUpdatedBy(actorId);
        repository.save(v);
        auditService.log("CANCEL_MEDICAL_VISIT", "MedicalVisit", visitId,
                actorId != null ? actorId : 0L, DosimetryRBACConfig.DOSIMETRY_MEDICAL,
                String.format("{\"reason\":\"%s\"}", escapeJson(reason)));
    }

    @Override
    public Long autoSchedulePostExposureVisit(Long workerId, Long mineId, Long openedBy) {
        // Idempotence : si une visite POST_EXPOSURE SCHEDULED existe deja, on ne re-cree pas.
        List<MedicalVisit> existing = repository.findByWorkerAndTypeAndStatus(workerId,
                MedicalVisitType.POST_EXPOSURE, VisitStatus.SCHEDULED);
        if (!existing.isEmpty()) {
            LOGGER.info("[MedicalVisitService] POST_EXPOSURE visit already scheduled for "
                    + "workerId={} (visitId={}). Skipping auto-schedule.",
                    workerId, existing.get(0).getId());
            return null;
        }
        LocalDate target = LocalDate.now().plusDays(POST_EXPOSURE_DELAY_DAYS);
        return scheduleVisit(workerId, mineId, MedicalVisitType.POST_EXPOSURE, target,
                openedBy != null ? openedBy : 0L, "Auto-scheduled (post-exposure case)",
                openedBy);
    }

    // ----------------------------------------------------------------------------
    // Lectures.
    // ----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<MedicalVisitSummaryDTO> getUpcomingVisits(Long mineId, int daysAhead) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(daysAhead);
        return repository.findUpcomingByMine(mineId, VisitStatus.SCHEDULED, from, to).stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalVisitSummaryDTO> getWorkerVisitsSummary(Long workerId, Long requesterId,
            String ipAddress) {
        // Trace d'acces nominatif (non-medical sensitif).
        auditService.log("READ_MEDICAL_VISIT_SUMMARY", "MedicalVisit", null,
                requesterId != null ? requesterId : 0L, null, ipAddress,
                String.format("{\"workerId\":%d}", workerId));
        return repository.findByWorkerIdOrderByScheduledDateDesc(workerId).stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalVisitFullDTO> getWorkerVisitsFull(Long workerId, Long requesterId,
            String reason, String ipAddress) {
        // CRITIQUE RGPD : audit obligatoire avant decryption (contains reason).
        auditService.log("VIEW_MEDICAL_DETAIL", "MedicalVisit", null,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"workerId\":%d,\"reason\":\"%s\"}",
                        workerId, escapeJson(reason)));
        return repository.findByWorkerIdOrderByScheduledDateDesc(workerId).stream()
                .map(this::toFullDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalVisitFullDTO getVisitFull(Long visitId, Long requesterId, String reason,
            String ipAddress) {
        MedicalVisit v = repository.findById(visitId)
                .orElseThrow(() -> new EntityNotFoundException("MedicalVisit not found: " + visitId));
        auditService.log("VIEW_MEDICAL_DETAIL", "MedicalVisit", visitId,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"visitId\":%d,\"reason\":\"%s\"}",
                        visitId, escapeJson(reason)));
        return toFullDTO(v);
    }

    // ----------------------------------------------------------------------------
    // Mapping.
    // ----------------------------------------------------------------------------

    private MedicalVisitSummaryDTO toSummaryDTO(MedicalVisit v) {
        return MedicalVisitSummaryDTO.builder()
                .id(v.getId())
                .workerId(v.getWorkerId())
                .mineId(v.getMineId())
                .visitType(v.getVisitType())
                .scheduledDate(v.getScheduledDate())
                .performedDate(v.getPerformedDate())
                .physicianId(v.getPhysicianId())
                .physicianName(v.getPhysicianName())
                .status(v.getStatus())
                .generalConclusion(v.getGeneralConclusion())
                .cancellationReason(v.getCancellationReason())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private MedicalVisitFullDTO toFullDTO(MedicalVisit v) {
        return MedicalVisitFullDTO.builder()
                .id(v.getId())
                .workerId(v.getWorkerId())
                .mineId(v.getMineId())
                .visitType(v.getVisitType())
                .scheduledDate(v.getScheduledDate())
                .performedDate(v.getPerformedDate())
                .physicianId(v.getPhysicianId())
                .physicianName(v.getPhysicianName())
                .status(v.getStatus())
                .generalConclusion(v.getGeneralConclusion())
                .detailedReport(v.getDetailedReport())
                .cancellationReason(v.getCancellationReason())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .createdBy(v.getCreatedBy())
                .updatedBy(v.getUpdatedBy())
                .build();
    }

    private String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }
}
