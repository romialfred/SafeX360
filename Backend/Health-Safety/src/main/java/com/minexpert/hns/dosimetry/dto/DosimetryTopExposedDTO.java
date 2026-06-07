package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;

import com.minexpert.hns.dosimetry.enums.KpiCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ligne du top N des workers les plus exposes (Phase 8 — KPI).
 *
 * <p><b>Affichage nominatif controle :</b> le backend expose le {@code workerName} (résolu via
 * la table {@code employee} partagée avec HRMS) pour les rôles MEDICAL / PCR / RPO qui ont
 * besoin d'identifier les expositions cumulées. Les rôles non-nominatifs côté frontend (UI
 * "anonymisée") doivent masquer le champ via le toggle utilisateur — la pseudo-anonymisation
 * UI ne change pas la charge utile API qui reste filtrée par RBAC au niveau du controller.
 * Si l'enrichissement RH échoue (table indisponible, employé supprimé), {@code workerName}
 * reste null.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryTopExposedDTO {

    private int rank;
    private Long workerId;
    /** Identifiant RH du salarié (FK vers la table employee), null si non renseigné. */
    private Long employeeId;
    /** Matricule RH (column unique_number) — null si lookup RH indisponible. */
    private String matricule;
    /** Nom complet "Prenom NOM" — null si lookup RH indisponible. */
    private String workerName;
    private KpiCategory category;
    /** Dose annuelle cumulee en mSv (Hp10). */
    private BigDecimal annualDose;
    /** Pourcentage par rapport a la limite reglementaire (0..n). */
    private BigDecimal percentOfLimit;
}
