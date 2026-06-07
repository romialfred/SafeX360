package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.util.List;

import com.minexpert.hns.dosimetry.dto.MedicalVisitFullDTO;
import com.minexpert.hns.dosimetry.dto.MedicalVisitSummaryDTO;
import com.minexpert.hns.dosimetry.enums.MedicalVisitType;

/**
 * Service de gestion des visites medicales (Phase 7).
 *
 * <p><b>CLOISONNEMENT RGPD :</b> les methodes retournent des DTO {@code Summary} pour les
 * roles non-medicaux et {@code Full} pour le role {@code DOSIMETRY_MEDICAL} uniquement. Tout
 * acces a {@code detailedReport} est tracee dans le journal d'audit avec
 * {@code VIEW_MEDICAL_DETAIL}.
 */
public interface MedicalVisitService {

    /**
     * Planifie une visite medicale.
     *
     * @param workerId         travailleur expose
     * @param mineId           mine de rattachement
     * @param type             type reglementaire de visite
     * @param scheduledDate    date prevue
     * @param physicianId      medecin du travail attribue
     * @param physicianName    snapshot du nom du medecin
     * @param createdBy        id utilisateur initiant la planification
     * @return id de la visite cree
     */
    Long scheduleVisit(Long workerId, Long mineId, MedicalVisitType type,
            LocalDate scheduledDate, Long physicianId, String physicianName, Long createdBy);

    /**
     * Realise une visite et verrouille la fiche (status=PERFORMED, append-only).
     *
     * <p><b>RBAC :</b> reserve au role {@code DOSIMETRY_MEDICAL}. Le controller doit gater
     * l'appel ; le service journalise systematiquement le createur via {@code performedBy}.
     *
     * @param visitId            visite cible
     * @param generalConclusion  libelle generique non-medical
     * @param detailedReport     compte-rendu detaille - sera chiffre en BDD
     * @param performedDate      date reelle de la visite
     * @param performedBy        id du medecin
     * @param ipAddress          adresse IP (audit)
     */
    void performVisit(Long visitId, String generalConclusion, String detailedReport,
            LocalDate performedDate, Long performedBy, String ipAddress);

    /**
     * Annule une visite planifiee (status=CANCELLED + motif).
     */
    void cancelVisit(Long visitId, String reason, Long actorId);

    /**
     * Liste des visites a venir sur {@code daysAhead} jours pour une mine. Retourne le DTO
     * SUMMARY (sans detailedReport) car la cible inclut le PCR_RPO.
     */
    List<MedicalVisitSummaryDTO> getUpcomingVisits(Long mineId, int daysAhead);

    /**
     * Toutes les visites d'un travailleur, en version SUMMARY (sans detailedReport).
     * Utilise par les vues self-service worker et PCR_RPO.
     */
    List<MedicalVisitSummaryDTO> getWorkerVisitsSummary(Long workerId, Long requesterId,
            String ipAddress);

    /**
     * Toutes les visites d'un travailleur, en version FULL avec detailedReport dechiffre.
     *
     * <p><b>RBAC :</b> appelable uniquement avec un acteur disposant de {@code DOSIMETRY_MEDICAL}.
     * Audit log enrichi obligatoire ({@code VIEW_MEDICAL_DETAIL} + reason + ipAddress).
     */
    List<MedicalVisitFullDTO> getWorkerVisitsFull(Long workerId, Long requesterId,
            String reason, String ipAddress);

    /**
     * Une visite en version FULL - role MEDICAL uniquement. Audit obligatoire.
     */
    MedicalVisitFullDTO getVisitFull(Long visitId, Long requesterId, String reason,
            String ipAddress);

    /**
     * Auto-schedule d'une visite POST_EXPOSURE 7 jours apres l'ouverture d'un
     * {@code OverexposureCase} (cf. Phase 5 hook). Idempotent : si une visite POST_EXPOSURE
     * SCHEDULED existe deja pour ce worker, ne cree rien.
     *
     * @return id de la visite cree, ou null si deja planifiee.
     */
    Long autoSchedulePostExposureVisit(Long workerId, Long mineId, Long openedBy);
}
