package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.KpiCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Representation API d'un {@link com.minexpert.hns.dosimetry.entity.DosimetryKpiSnapshot}.
 *
 * <p>Donnees STRICTEMENT agregees - aucun champ nominatif. Le DTO est consomme par les
 * dashboards executifs et le bouton "Rapports &amp; Analytics" de la sidebar.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryKpiSnapshotDTO {

    private Long id;
    private Long mineId;
    private LocalDate snapshotDate;
    private KpiCategory category;

    private long workersCount;
    private long doseRecordsCount;

    private BigDecimal avgAnnualDose;
    private BigDecimal medianAnnualDose;
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

    private LocalDateTime createdAt;
}
