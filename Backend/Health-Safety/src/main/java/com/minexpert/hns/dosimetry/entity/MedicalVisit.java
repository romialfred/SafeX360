package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.MedicalVisitType;
import com.minexpert.hns.dosimetry.enums.VisitStatus;
import com.minexpert.hns.dosimetry.util.AESEncryptionConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Visite medicale d'un travailleur expose (Phase 7 — Surveillance medicale renforcee).
 *
 * <p><b>CLOISONNEMENT STRICT MEDECIN DU TRAVAIL :</b> le champ {@code detailedReport} contient
 * le compte-rendu medical detaille du medecin du travail (diagnostics, interrogatoire clinique,
 * resultats biologiques...). Il est :
 * <ul>
 *   <li><b>chiffre au repos AES-256-GCM</b> via {@link AESEncryptionConverter} ;</li>
 *   <li><b>strictement reserve au role {@code DOSIMETRY_MEDICAL}</b> en lecture/ecriture ;</li>
 *   <li><b>JAMAIS expose</b> dans une reponse API destinee aux roles PCR_RPO / RH / WORKER.</li>
 * </ul>
 * Pour ces autres roles, seul {@code generalConclusion} (libelle generique non clinique :
 * "Visite effectuee — aptitude voir fiche d'aptitude") est expose.
 *
 * <p><b>APPEND-ONLY apres {@code status=PERFORMED} :</b> une fois la visite realisee, les
 * champs {@code performedDate} et {@code detailedReport} sont verrouilles cote JPA
 * ({@code updatable=false}) ET cote BDD (trigger). C'est une exigence reglementaire AIEA
 * GSR Part 3 §3.106 : tout dossier medical en lien avec une exposition doit etre conserve
 * 30+ ans apres cessation d'activite et ne peut etre modifie retroactivement.
 *
 * <p><b>Indexation :</b>
 * <ul>
 *   <li>{@code (worker_id, scheduled_date DESC)} : timeline des visites par travailleur.</li>
 *   <li>{@code (mine_id, visit_type, status)} : tableau de bord par mine et type.</li>
 * </ul>
 */
@Entity
@Table(name = "dosimetry_medical_visit",
        indexes = {
                @Index(name = "idx_medical_visit_worker_scheduled",
                        columnList = "worker_id, scheduled_date DESC"),
                @Index(name = "idx_medical_visit_mine_type_status",
                        columnList = "mine_id, visit_type, status"),
                @Index(name = "idx_medical_visit_status_scheduled",
                        columnList = "status, scheduled_date")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false, updatable = false)
    private Long workerId;

    @Column(name = "mine_id", nullable = false, updatable = false)
    private Long mineId;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", nullable = false, updatable = false, length = 32)
    private MedicalVisitType visitType;

    /** Date planifiee initiale (peut etre re-planifiee tant que status=SCHEDULED). */
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    /**
     * Date reelle de la visite. APPEND-ONLY apres mise a status=PERFORMED.
     * Renseignee uniquement par {@code performVisit}.
     */
    @Column(name = "performed_date", updatable = false)
    private LocalDate performedDate;

    /**
     * Id du medecin ayant pris en charge la visite (cible la table users / employes). Sert de
     * preuve d'imputation. Non modifiable une fois la visite planifiee.
     */
    @Column(name = "physician_id", nullable = false, updatable = false)
    private Long physicianId;

    /**
     * Snapshot du nom du medecin au moment de la planification. Permet de conserver la
     * tracabilite meme si l'enregistrement de l'utilisateur est ulterieurement archive
     * ou anonymise (RGPD - droit a l'oubli RH).
     */
    @Column(name = "physician_name", length = 255, updatable = false)
    private String physicianName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private VisitStatus status;

    /**
     * Conclusion generique non clinique exposable aux roles non-medicaux (PCR/RPO, RH,
     * travailleur). Ex : "Visite realisee - aptitude voir FitnessAssessment associee".
     */
    @Column(name = "general_conclusion", columnDefinition = "TEXT")
    private String generalConclusion;

    /**
     * Compte-rendu medical detaille - CONFIDENTIEL. Chiffre au repos AES-256-GCM via
     * {@link AESEncryptionConverter}. Acces lecture/ecriture strictement limite a
     * {@code DOSIMETRY_MEDICAL}. APPEND-ONLY apres performedDate (updatable=false).
     */
    @Convert(converter = AESEncryptionConverter.class)
    @Column(name = "detailed_report", columnDefinition = "TEXT", updatable = false)
    private String detailedReport;

    /** Motif lorsque la visite est annulee (information de pilotage, pas medical). */
    @Column(name = "cancellation_reason", length = 512)
    private String cancellationReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;
}
