package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Etat global plateforme Dosimetrie (Phase 8 — KPI executif tous sites confondus).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryGlobalStatusDTO {

    private LocalDate snapshotDate;
    private long minesCount;
    private long workersCount;
    private long doseRecordsCount;
    private BigDecimal avgAnnualDose;
    private BigDecimal maxAnnualDose;
    private long workersOver50Pct;
    private long workersOver75Pct;
    private long workersOver90Pct;
    private long workersOver100Pct;
    private long activeAlertsCount;
    private long overexposureCasesOpen;
    private long fitnessExpiringSoon;
    private long measurementPointsCount;
    private BigDecimal ambientAvgUsvh;
}
