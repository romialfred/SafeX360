package com.minexpert.hns.dto.ppe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Tableau de bord « Suivi des EPI » — pilotage des stocks & distributions.
 * Tout est dérivé du catalogue, du JOURNAL de mouvements et des demandes réelles ;
 * aucune donnée fabriquée. Cloisonné par mine.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeMonitoringDTO {

    private String currency;
    private int totalReferences;

    // ── Indicateurs clés ──
    private double stockValue;
    private long availableUnits;
    private long reservedUnits;
    private int criticalCount;      // ruptures + sous seuil
    private int rupturesCount;
    private int belowThresholdCount;
    private long distributedThisMonth;
    private int pendingRequests;
    private int priorityPending;
    private double coverageRate;     // % de références au-dessus du seuil

    // ── Séries & répartitions ──
    private List<MonthPoint> monthly;       // évolution entrées/sorties/stock
    private HealthBreakdown health;         // santé du stock
    private List<DeptDistribution> byDepartment;
    private List<Alert> alerts;
    private List<WatchItem> watchlist;      // références à surveiller
    private Rotation rotation;
    private ValueSplit valueSplit;          // répartition de la valeur

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class MonthPoint {
        private String label;   // ex. « 2025-03 »
        private long entries;   // réceptions (RECEIPT + RETURN)
        private long issues;    // distributions (ISSUE)
        private long stock;     // stock disponible cumulé en fin de mois
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class HealthBreakdown {
        private int score;          // 0..100
        private int healthy;        // sain (stock > seuil)
        private int belowThreshold; // sous seuil
        private int outOfStock;     // rupture
        private int dormant;        // sans sortie depuis 90 j
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class DeptDistribution {
        private String department;
        private long units;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Alert {
        private String title;
        private String detail;
        private String severity; // CRITICAL / HIGH / MEDIUM / LOW
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class WatchItem {
        private Long ppeId;
        private String name;
        private String category;
        private long available;
        private long reserved;
        private Integer threshold;
        private Integer coverageDays; // stock / conso quotidienne moyenne
        private double value;
        private String status;        // HEALTHY / LOW / OUT
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Rotation {
        private double avgRotation;    // sorties / stock moyen sur la période
        private double dormantValue;
        private double dormantPct;
        private int avgCoverageDays;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ValueSplit {
        private double available;
        private double reserved;
        private double dormant;
        private double toScrap; // à réformer (au-delà de la durée de vie / rupture)
    }
}
