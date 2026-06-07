package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ligne d'agregat KPI a la maille mine (Phase 8 — comparatif cross-tenant).
 *
 * <p>Toutes categories confondues : {@code workersCount} est la somme des workers de toutes
 * les categories au snapshot date, {@code avgAnnualDose} la moyenne ponderee.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryMineComparisonDTO {

    private Long mineId;
    private LocalDate snapshotDate;
    private long workersCount;
    private BigDecimal avgAnnualDose;
    private BigDecimal maxAnnualDose;
    private long workersOver100Pct;
    private long activeAlertsCount;
    private long overexposureCasesOpen;
    private BigDecimal ambientAvgUsvh;
}
