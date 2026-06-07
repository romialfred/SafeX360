package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Seuils dosimetriques (contrainte de dose, niveau d'investigation, niveau d'action, limite
 * reglementaire) par couple (grandeur, categorie de personne).
 *
 * <p>mineId nullable : si null, il s'agit du seuil par defaut global (utilise comme fallback
 * en absence de configuration specifique a la mine).
 *
 * <p>warnPercentages : JSON array d'entiers (ex. "[75, 90]") declenchant les alertes APPROACH.
 */
@Entity
@Table(name = "dosimetry_threshold")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Threshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null = seuil global par defaut. */
    @Column(name = "mine_id")
    private Long mineId;

    @Enumerated(EnumType.STRING)
    @Column(name = "grandeur", nullable = false, length = 16)
    private ThresholdGrandeur grandeur;

    /** WORKER_A | WORKER_B | APPRENTICE | PREGNANCY | PUBLIC. */
    @Column(name = "person_category", nullable = false, length = 32)
    private String personCategory;

    @Column(name = "dose_constraint")
    private Double doseConstraint;

    @Column(name = "investigation_level")
    private Double investigationLevel;

    @Column(name = "action_level")
    private Double actionLevel;

    @Column(name = "regulatory_limit")
    private Double regulatoryLimit;

    /** JSON array d'entiers, ex. "[75,90]". */
    @Column(name = "warn_percentages", length = 128)
    private String warnPercentages;

    @Column(name = "unit", nullable = false, length = 8)
    private String unit;

    /** Ex. "CIPR_103" ou "AIEA_GSR_PART3". */
    @Column(name = "reference_framework", nullable = false, length = 64)
    private String referenceFramework;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
