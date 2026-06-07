package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentFullDTO;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentPublicDTO;
import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation de {@link FitnessAssessmentService}.
 *
 * <p><b>SECURITE & RGPD :</b>
 * <ul>
 *   <li>Toute lecture du DTO Full est tracee via {@code VIEW_FITNESS_DETAIL} +
 *       reason + ipAddress.</li>
 *   <li>La signature lock l'aptitude : on rejette toute creation a partir d'une fiche signee
 *       (verifie cote service ET cote BDD via trigger).</li>
 *   <li>Notification automatique des UNFIT / TEMPORARILY_UNFIT : audit-log avec action
 *       {@code FITNESS_NOTIFY_PCR_RH} pour consommation downstream par module Notifications.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FitnessAssessmentServiceImpl implements FitnessAssessmentService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(FitnessAssessmentServiceImpl.class);

    /** Cron quotidien 01:30 - detection des aptitudes expirantes (cf. {@link #scheduledExpiringScan()}). */
    static final int DEFAULT_EXPIRY_LOOKAHEAD_DAYS = 30;

    private final FitnessAssessmentRepository repository;
    private final DosimetryAuditService auditService;

    // ----------------------------------------------------------------------------
    // Ecritures.
    // ----------------------------------------------------------------------------

    @Override
    public Long createAssessment(Long workerId, Long mineId, Long medicalVisitId,
            FitnessLevel fitness, String restrictions, String publicSummary,
            LocalDate assessmentDate, LocalDate validUntil, LocalDate reviewRequiredDate,
            Long physicianId, String physicianName, Long createdBy) {
        if (workerId == null || mineId == null || fitness == null || assessmentDate == null
                || physicianId == null) {
            throw new IllegalArgumentException(
                    "workerId, mineId, fitness, assessmentDate, physicianId are required");
        }
        LocalDateTime now = LocalDateTime.now();
        FitnessAssessment f = FitnessAssessment.builder()
                .workerId(workerId)
                .mineId(mineId)
                .medicalVisitId(medicalVisitId)
                .assessmentDate(assessmentDate)
                .validUntil(validUntil)
                .fitness(fitness)
                .restrictions(restrictions)
                .publicRestrictionsSummary(publicSummary)
                .reviewRequiredDate(reviewRequiredDate)
                .physicianId(physicianId)
                .physicianName(physicianName)
                .signed(false)
                .createdAt(now)
                .createdBy(createdBy)
                .updatedAt(now)
                .updatedBy(createdBy)
                .build();
        FitnessAssessment saved = repository.save(f);
        auditService.log("CREATE_FITNESS_ASSESSMENT", "FitnessAssessment", saved.getId(),
                createdBy != null ? createdBy : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL,
                String.format("{\"workerId\":%d,\"fitness\":\"%s\",\"signed\":false}",
                        workerId, fitness.name()));
        // Notification PCR_RPO + RH si inapte (full ou temporaire) - audit only, pas frontend yet.
        if (fitness == FitnessLevel.UNFIT || fitness == FitnessLevel.TEMPORARILY_UNFIT) {
            auditService.log("FITNESS_NOTIFY_PCR_RH", "FitnessAssessment", saved.getId(),
                    createdBy != null ? createdBy : 0L,
                    DosimetryRBACConfig.DOSIMETRY_MEDICAL,
                    String.format("{\"workerId\":%d,\"fitness\":\"%s\",\"reviewRequiredDate\":\"%s\"}",
                            workerId, fitness.name(),
                            reviewRequiredDate != null ? reviewRequiredDate.toString() : "null"));
        }
        return saved.getId();
    }

    @Override
    public void signAssessment(Long assessmentId, Long physicianId, String ipAddress) {
        FitnessAssessment f = repository.findById(assessmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "FitnessAssessment not found: " + assessmentId));
        if (f.isSigned()) {
            throw new IllegalStateException(
                    "Assessment already signed (locked) - id=" + assessmentId);
        }
        if (physicianId == null) {
            throw new IllegalArgumentException("physicianId is required for signature");
        }
        // On peut autoriser un medecin different (gardien remplacant) ; on ne contraint pas
        // l'egalite avec f.physicianId pour eviter de bloquer en cas de transfert de dossier.
        // Tracabilite assuree via le payload audit ci-dessous.
        LocalDateTime now = LocalDateTime.now();
        f.setSigned(true);
        f.setSignedAt(now);
        f.setUpdatedAt(now);
        f.setUpdatedBy(physicianId);
        repository.save(f);
        auditService.log("SIGN_FITNESS_ASSESSMENT", "FitnessAssessment", assessmentId,
                physicianId, DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"workerId\":%d,\"fitness\":\"%s\",\"signedAt\":\"%s\","
                                + "\"originalPhysicianId\":%d}",
                        f.getWorkerId(), f.getFitness().name(), now,
                        f.getPhysicianId() != null ? f.getPhysicianId() : 0L));
    }

    // ----------------------------------------------------------------------------
    // Lectures - DTO Public.
    // ----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public Optional<FitnessAssessmentPublicDTO> getCurrentFitnessPublic(Long workerId,
            Long requesterId, String ipAddress) {
        auditService.log("READ_CURRENT_FITNESS_PUBLIC", "FitnessAssessment", null,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, ipAddress,
                String.format("{\"workerId\":%d}", workerId));
        return repository.findCurrentSigned(workerId).map(this::toPublicDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FitnessAssessmentPublicDTO> getAllAssessmentsPublic(Long workerId,
            Long requesterId, String ipAddress) {
        auditService.log("READ_FITNESS_HISTORY_PUBLIC", "FitnessAssessment", null,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, ipAddress,
                String.format("{\"workerId\":%d}", workerId));
        return repository.findByWorkerIdOrderByAssessmentDateDesc(workerId).stream()
                .filter(FitnessAssessment::isSigned)
                .map(this::toPublicDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------------------
    // Lectures - DTO Full (MEDICAL).
    // ----------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public Optional<FitnessAssessmentFullDTO> getCurrentFitnessFull(Long workerId,
            Long requesterId, String reason, String ipAddress) {
        auditService.log("VIEW_FITNESS_DETAIL", "FitnessAssessment", null,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"workerId\":%d,\"scope\":\"current\",\"reason\":\"%s\"}",
                        workerId, escapeJson(reason)));
        return repository.findCurrentSigned(workerId).map(this::toFullDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FitnessAssessmentFullDTO> getAllAssessmentsFull(Long workerId,
            Long requesterId, String reason, String ipAddress) {
        auditService.log("VIEW_FITNESS_DETAIL", "FitnessAssessment", null,
                requesterId != null ? requesterId : 0L,
                DosimetryRBACConfig.DOSIMETRY_MEDICAL, ipAddress,
                String.format("{\"workerId\":%d,\"scope\":\"history\",\"reason\":\"%s\"}",
                        workerId, escapeJson(reason)));
        return repository.findByWorkerIdOrderByAssessmentDateDesc(workerId).stream()
                .map(this::toFullDTO)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------------------
    // Scheduler & checks.
    // ----------------------------------------------------------------------------

    @Override
    public int checkExpiringAssessments(int daysAhead) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(daysAhead);
        List<FitnessAssessment> expiring = repository.findExpiringBetween(from, to);
        if (expiring.isEmpty()) {
            return 0;
        }
        for (FitnessAssessment f : expiring) {
            auditService.log("FITNESS_EXPIRING_DETECTED", "FitnessAssessment", f.getId(),
                    0L, DosimetryRBACConfig.DOSIMETRY_MEDICAL, null,
                    String.format("{\"workerId\":%d,\"validUntil\":\"%s\","
                                    + "\"daysAhead\":%d,\"fitness\":\"%s\"}",
                            f.getWorkerId(), f.getValidUntil(), daysAhead,
                            f.getFitness().name()));
        }
        LOGGER.info("[FitnessAssessmentService] {} fitness assessments expire within {} days.",
                expiring.size(), daysAhead);
        return expiring.size();
    }

    /**
     * Cron quotidien 01:30 - scan des aptitudes expirantes a 30 jours.
     */
    @Scheduled(cron = "0 30 1 * * *")
    public void scheduledExpiringScan() {
        try {
            int count = checkExpiringAssessments(DEFAULT_EXPIRY_LOOKAHEAD_DAYS);
            LOGGER.debug("[FitnessAssessmentService] Scheduled expiring scan: {} hits.", count);
        } catch (Exception ex) {
            LOGGER.error("[FitnessAssessmentService] Scheduled expiring scan failed: {}",
                    ex.getMessage(), ex);
        }
    }

    // ----------------------------------------------------------------------------
    // Mapping.
    // ----------------------------------------------------------------------------

    private FitnessAssessmentPublicDTO toPublicDTO(FitnessAssessment f) {
        return FitnessAssessmentPublicDTO.builder()
                .id(f.getId())
                .workerId(f.getWorkerId())
                .mineId(f.getMineId())
                .assessmentDate(f.getAssessmentDate())
                .validUntil(f.getValidUntil())
                .fitness(f.getFitness())
                .publicRestrictionsSummary(f.getPublicRestrictionsSummary())
                .reviewRequiredDate(f.getReviewRequiredDate())
                .signed(f.isSigned())
                .build();
    }

    private FitnessAssessmentFullDTO toFullDTO(FitnessAssessment f) {
        return FitnessAssessmentFullDTO.builder()
                .id(f.getId())
                .workerId(f.getWorkerId())
                .mineId(f.getMineId())
                .medicalVisitId(f.getMedicalVisitId())
                .assessmentDate(f.getAssessmentDate())
                .validUntil(f.getValidUntil())
                .fitness(f.getFitness())
                .restrictions(f.getRestrictions())
                .publicRestrictionsSummary(f.getPublicRestrictionsSummary())
                .reviewRequiredDate(f.getReviewRequiredDate())
                .physicianId(f.getPhysicianId())
                .physicianName(f.getPhysicianName())
                .signed(f.isSigned())
                .signedAt(f.getSignedAt())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .createdBy(f.getCreatedBy())
                .updatedBy(f.getUpdatedBy())
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
