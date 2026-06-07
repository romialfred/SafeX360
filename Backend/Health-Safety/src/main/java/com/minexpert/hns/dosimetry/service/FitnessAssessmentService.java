package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.minexpert.hns.dosimetry.dto.FitnessAssessmentFullDTO;
import com.minexpert.hns.dosimetry.dto.FitnessAssessmentPublicDTO;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;

/**
 * Service de gestion des fiches d'aptitude (Phase 7).
 *
 * <p><b>CLOISONNEMENT RGPD :</b> les methodes retournent {@code Public} (PCR_RPO / self) ou
 * {@code Full} (MEDICAL). Tout acces aux {@code restrictions} dechiffrees est audite.
 */
public interface FitnessAssessmentService {

    /**
     * Cree une fiche d'aptitude (non signee par defaut).
     *
     * <p><b>RBAC :</b> role {@code DOSIMETRY_MEDICAL} uniquement.
     */
    Long createAssessment(Long workerId, Long mineId, Long medicalVisitId,
            FitnessLevel fitness, String restrictions, String publicSummary,
            LocalDate assessmentDate, LocalDate validUntil, LocalDate reviewRequiredDate,
            Long physicianId, String physicianName, Long createdBy);

    /**
     * Signe une fiche - une fois signee, {@code fitness} et {@code restrictions} deviennent
     * APPEND-ONLY (cf. JPA updatable=false + trigger SQL).
     */
    void signAssessment(Long assessmentId, Long physicianId, String ipAddress);

    /**
     * Aptitude courante d'un travailleur en version PUBLIC (PCR_RPO / self). Pas de
     * details cliniques.
     */
    Optional<FitnessAssessmentPublicDTO> getCurrentFitnessPublic(Long workerId, Long requesterId,
            String ipAddress);

    /**
     * Aptitude courante en version FULL - role MEDICAL uniquement. Audit obligatoire.
     */
    Optional<FitnessAssessmentFullDTO> getCurrentFitnessFull(Long workerId, Long requesterId,
            String reason, String ipAddress);

    /**
     * Historique complet en version FULL - role MEDICAL uniquement.
     */
    List<FitnessAssessmentFullDTO> getAllAssessmentsFull(Long workerId, Long requesterId,
            String reason, String ipAddress);

    /**
     * Historique complet en version PUBLIC (PCR_RPO / self).
     */
    List<FitnessAssessmentPublicDTO> getAllAssessmentsPublic(Long workerId, Long requesterId,
            String ipAddress);

    /**
     * Detecte les fiches expirant dans les {@code daysAhead} jours et logge un audit. Hook
     * scheduler @Scheduled quotidien.
     *
     * @return nombre de fiches expirantes detectees.
     */
    int checkExpiringAssessments(int daysAhead);
}
