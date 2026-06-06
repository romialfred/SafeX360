package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Tableau de bord Emergency agrégé (LOT 48 Phase 5).
 *
 * <p>Inclut KPIs SOS + Alertes Générales + lifecycle timings + breakdown
 * par motif/jour pour graphiques. Calculé côté serveur pour minimiser la
 * charge réseau et garantir la cohérence des chiffres.</p>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmergencyDashboardDTO {

    private Long companyId;
    private Integer windowDays;

    // ── KPIs SOS ──
    private Long sosTotal;
    private Long sosActive;
    private Long sosClosed;
    private Long sosFalseAlarm;
    /** Hors fausse alerte. Pour KPI taux résolution. */
    private Long sosClosedReal;
    /** Durée moyenne (s) entre RECEIVED et CLOSED pour les SOS clôturés. */
    private Long sosAvgResolutionSeconds;
    /** Durée moyenne (s) entre RECEIVED et ACKNOWLEDGED (KPI réactivité coordinateur). */
    private Long sosAvgAckSeconds;

    // ── KPIs Alertes Générales ──
    private Long generalAlertsTotal;
    private Long generalAlertsActive;
    private Long generalAlertsDrills;
    private Long generalAlertsReal;
    /** Durée moyenne (s) entre déclenchement et fin pour les alertes terminées. */
    private Long generalAlertAvgDurationSeconds;

    // ── Top motifs (limit 6) — pour pie/bar chart ──
    private List<TopReasonEntry> topReasonsSos;

    // ── Distribution par status (pour pie chart) ──
    private Map<String, Long> sosByStatus;

    // ── Timeline 7/30 derniers jours (pour line chart) ──
    private List<DailyCountEntry> sosDailyCounts;
    private List<DailyCountEntry> generalAlertDailyCounts;

    // ── Top coordinateurs (limit 5) — qui a traité le plus de SOS ──
    private List<TopActorEntry> topCoordinators;

    // ── Positions GPS des SOS récents (pour heatmap / map) ──
    private List<SosLocationEntry> recentSosLocations;

    /** Heure de génération côté serveur (UTC). */
    private String generatedAt;

    // ─────────────────────────────────────────────────────────────────────────

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopReasonEntry {
        private String reasonCode;
        private Long count;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyCountEntry {
        private LocalDate date;
        private Long count;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopActorEntry {
        private Long actorId;
        private String actorName;
        private Long count;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SosLocationEntry {
        private Long id;
        private Double latitude;
        private Double longitude;
        private String status;
        private String reasonCode;
        private String triggeredAt;
    }
}
