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
 * <p><b>Pseudonymise :</b> aucun nom / matricule clair. On ne renvoie que le {@code rank},
 * le {@code workerId} interne et la dose cumulee. L'enrichissement RH (matricule / nom) reste
 * la responsabilite du front en croisant avec les endpoints du Registre (qui eux portent le
 * RBAC {@code DOSIMETRY_READ_NOMINATIVE}). Cet endpoint reste sous {@code DOSIMETRY_READ_AGGREGATE}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryTopExposedDTO {

    private int rank;
    private Long workerId;
    private KpiCategory category;
    /** Dose annuelle cumulee en mSv (Hp10). */
    private BigDecimal annualDose;
    /** Pourcentage par rapport a la limite reglementaire (0..n). */
    private BigDecimal percentOfLimit;
}
