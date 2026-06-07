package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.FitnessLevel;
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
 * Fiche d'aptitude au poste expose (Phase 7).
 *
 * <p>Une fiche d'aptitude est emise par le medecin du travail a l'issue d'une visite
 * (cf. {@link MedicalVisit}) et formalise la decision d'aptitude. Elle separe strictement :
 * <ul>
 *   <li>{@code restrictions} - contenu medical complet (diagnostics, contre-indications)
 *       <b>chiffre AES-256-GCM</b>, accessible UNIQUEMENT au role {@code DOSIMETRY_MEDICAL}.</li>
 *   <li>{@code publicRestrictionsSummary} - resume non-medical operationnel destine au
 *       PCR/RPO et a la hierarchie, ex : "Eviter zone controlee pendant 6 mois". JAMAIS de
 *       donnee clinique sensible ici.</li>
 * </ul>
 *
 * <p><b>SIGNATURE ELECTRONIQUE :</b> tant que {@code signed=false}, le medecin peut corriger
 * la fiche. Apres signature ({@link #setSigned(boolean)} + {@code signedAt}), les champs
 * {@code fitness} et {@code restrictions} sont verrouilles cote JPA (updatable=false) ET
 * cote BDD (trigger SQL). C'est l'equivalent reglementaire d'un "lock"
 * (AIEA GSR Part 3 §3.106).
 *
 * <p><b>Indexation :</b>
 * <ul>
 *   <li>{@code (worker_id, assessment_date DESC)} : derniere fitness en tete.</li>
 *   <li>{@code (mine_id, fitness)} : tableau de bord par mine et niveau.</li>
 *   <li>{@code (valid_until)} : scheduler de detection des aptitudes expirantes.</li>
 * </ul>
 */
@Entity
@Table(name = "dosimetry_fitness_assessment",
        indexes = {
                @Index(name = "idx_fitness_worker_assessment_date",
                        columnList = "worker_id, assessment_date DESC"),
                @Index(name = "idx_fitness_mine_level",
                        columnList = "mine_id, fitness"),
                @Index(name = "idx_fitness_valid_until",
                        columnList = "valid_until")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitnessAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false, updatable = false)
    private Long workerId;

    @Column(name = "mine_id", nullable = false, updatable = false)
    private Long mineId;

    /**
     * Visite medicale source de cette fiche d'aptitude (peut etre null pour les fiches
     * historiques importees).
     */
    @Column(name = "medical_visit_id", updatable = false)
    private Long medicalVisitId;

    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;

    /** Date de fin de validite. Au-dela : nouvelle visite obligatoire. */
    @Column(name = "valid_until")
    private LocalDate validUntil;

    /**
     * Niveau d'aptitude. APPEND-ONLY apres signature (cf. JavaDoc classe et trigger SQL).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "fitness", nullable = false, length = 32, updatable = false)
    private FitnessLevel fitness;

    /**
     * Details cliniques des restrictions - CONFIDENTIEL. Chiffre AES-256-GCM au repos.
     * Acces strictement reserve au role {@code DOSIMETRY_MEDICAL}. APPEND-ONLY apres
     * signature.
     */
    @Convert(converter = AESEncryptionConverter.class)
    @Column(name = "restrictions", columnDefinition = "TEXT", updatable = false)
    private String restrictions;

    /**
     * Resume non-medical des restrictions, expose au PCR/RPO et a la hierarchie. Ne doit
     * contenir AUCUNE information clinique (diagnostic, traitement, contre-indication
     * specifique). Exemples : "Eviter zone controlee pendant 6 mois", "Restriction port de
     * charge", "Pas de poste de nuit".
     */
    @Column(name = "public_restrictions_summary", columnDefinition = "TEXT")
    private String publicRestrictionsSummary;

    /** Date a laquelle l'aptitude doit etre revue (pour TEMPORARILY_UNFIT notamment). */
    @Column(name = "review_required_date")
    private LocalDate reviewRequiredDate;

    @Column(name = "physician_id", nullable = false)
    private Long physicianId;

    @Column(name = "physician_name", length = 255)
    private String physicianName;

    /** Marqueur de signature electronique. Une fois {@code true}, lock APPEND-ONLY. */
    @Column(name = "signed", nullable = false)
    private boolean signed;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;
}
