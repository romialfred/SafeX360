package com.minexpert.hns.dosimetry.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.KpiCategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Snapshot agrege des indicateurs dosimetriques (Phase 8 — KPI dashboard executif).
 *
 * <p>Materialise des agregations couteuses (moyenne / mediane / max de la dose annuelle,
 * histogramme de depassement des seuils, comptes d'alertes, etc.) afin d'eviter le N+1 sur
 * de gros parcs de travailleurs. Chaque ligne couvre la dimension
 * {@code (mineId, snapshotDate, category)}.
 *
 * <p><b>Append-only :</b> un snapshot ne doit pas etre modifie apres calcul. Le recompute
 * journalier produit un nouveau snapshot pour la date du jour. L'unicite
 * {@code (mineId, snapshotDate, category)} sert d'upsert key.
 *
 * <p>Indexation : {@code (mineId, snapshotDate DESC, category)} pour servir efficacement les
 * requetes "derniers KPI d'une mine" et les series temporelles.
 */
@Entity
@Table(name = "dosimetry_kpi_snapshot",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_kpi_snapshot_mine_date_category",
                        columnNames = {"mine_id", "snapshot_date", "category"})
        },
        indexes = {
                @Index(name = "idx_kpi_snapshot_mine_date_category",
                        columnList = "mine_id, snapshot_date DESC, category"),
                @Index(name = "idx_kpi_snapshot_date",
                        columnList = "snapshot_date DESC")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryKpiSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mine_id", nullable = false, updatable = false)
    private Long mineId;

    @Column(name = "snapshot_date", nullable = false, updatable = false)
    private LocalDate snapshotDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, updatable = false, length = 16)
    private KpiCategory category;

    @Column(name = "workers_count", nullable = false, updatable = false)
    private long workersCount;

    @Column(name = "dose_records_count", nullable = false, updatable = false)
    private long doseRecordsCount;

    @Column(name = "avg_annual_dose", updatable = false, precision = 12, scale = 4)
    private BigDecimal avgAnnualDose;

    @Column(name = "median_annual_dose", updatable = false, precision = 12, scale = 4)
    private BigDecimal medianAnnualDose;

    @Column(name = "max_annual_dose", updatable = false, precision = 12, scale = 4)
    private BigDecimal maxAnnualDose;

    @Column(name = "workers_over_50_pct", nullable = false, updatable = false)
    private long workersOver50Pct;

    @Column(name = "workers_over_75_pct", nullable = false, updatable = false)
    private long workersOver75Pct;

    @Column(name = "workers_over_90_pct", nullable = false, updatable = false)
    private long workersOver90Pct;

    @Column(name = "workers_over_100_pct", nullable = false, updatable = false)
    private long workersOver100Pct;

    @Column(name = "active_alerts_count", nullable = false, updatable = false)
    private long activeAlertsCount;

    @Column(name = "overexposure_cases_open", nullable = false, updatable = false)
    private long overexposureCasesOpen;

    @Column(name = "fitness_expiring_soon", nullable = false, updatable = false)
    private long fitnessExpiringSoon;

    @Column(name = "measurement_points_count", nullable = false, updatable = false)
    private long measurementPointsCount;

    @Column(name = "ambient_avg_usvh", updatable = false, precision = 14, scale = 4)
    private BigDecimal ambientAvgUsvh;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
