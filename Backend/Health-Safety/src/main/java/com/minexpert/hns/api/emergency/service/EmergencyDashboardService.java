package com.minexpert.hns.api.emergency.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO;
import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO.DailyCountEntry;
import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO.SosLocationEntry;
import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO.TopActorEntry;
import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO.TopReasonEntry;
import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;
import com.minexpert.hns.api.emergency.enums.SosStatus;
import com.minexpert.hns.api.emergency.repository.GeneralAlertRepository;
import com.minexpert.hns.api.emergency.repository.SosAlertRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service d'agrégation pour le Tableau de bord Emergency (LOT 48 Phase 5).
 *
 * <p>Calcule en mémoire toutes les statistiques à partir des entités SOS et
 * Alerte Générale. Pour une mine de taille moyenne (≤ 500 alertes / mois),
 * la charge est négligeable. Si scale-up nécessaire en Phase 6, on bascule
 * sur des requêtes JPQL agrégées + cache Caffeine.</p>
 */
@Service
@RequiredArgsConstructor
public class EmergencyDashboardService {

    private final SosAlertRepository sosRepo;
    private final GeneralAlertRepository alertRepo;

    @Transactional(readOnly = true)
    public EmergencyDashboardDTO getSummary(Long companyId, int windowDays) {
        if (windowDays <= 0) windowDays = 7;
        LocalDateTime since = LocalDateTime.now().minusDays(windowDays);

        // ── Récupère tous les SOS de la fenêtre ──
        List<SosAlert> allSos = sosRepo.findByCompanyIdOrderByTriggeredAtDesc(companyId);
        List<SosAlert> windowSos = allSos.stream()
            .filter(a -> a.getTriggeredAt() != null && a.getTriggeredAt().isAfter(since))
            .toList();

        // ── Récupère toutes les alertes générales de la fenêtre ──
        List<GeneralAlert> allAlerts = alertRepo.findByCompanyIdOrderByTriggeredAtDesc(companyId);
        List<GeneralAlert> windowAlerts = allAlerts.stream()
            .filter(a -> a.getTriggeredAt() != null && a.getTriggeredAt().isAfter(since))
            .toList();

        // ── KPIs SOS ──
        long sosTotal = windowSos.size();
        long sosActive = windowSos.stream()
            .filter(s -> s.getStatus() != SosStatus.CLOSED && s.getStatus() != SosStatus.FALSE_ALARM)
            .count();
        long sosClosed = windowSos.stream()
            .filter(s -> s.getStatus() == SosStatus.CLOSED)
            .count();
        long sosFalseAlarm = windowSos.stream()
            .filter(s -> s.getStatus() == SosStatus.FALSE_ALARM)
            .count();

        // Durée moyenne résolution (RECEIVED → CLOSED)
        long sosAvgResolutionSeconds = (long) windowSos.stream()
            .filter(s -> s.getStatus() == SosStatus.CLOSED && s.getClosedAt() != null)
            .mapToLong(s -> Duration.between(s.getTriggeredAt(), s.getClosedAt()).getSeconds())
            .average()
            .orElse(0);

        // Durée moyenne ack (RECEIVED → ACKNOWLEDGED)
        long sosAvgAckSeconds = (long) windowSos.stream()
            .filter(s -> s.getAcknowledgedAt() != null)
            .mapToLong(s -> Duration.between(s.getTriggeredAt(), s.getAcknowledgedAt()).getSeconds())
            .average()
            .orElse(0);

        // ── KPIs Alertes Générales ──
        long alertsTotal = windowAlerts.size();
        long alertsActive = windowAlerts.stream()
            .filter(a -> a.getStatus() == GeneralAlertStatus.ACTIVE)
            .count();
        long alertsDrills = windowAlerts.stream()
            .filter(a -> Boolean.TRUE.equals(a.getDrillMode()))
            .count();
        long alertsReal = alertsTotal - alertsDrills;
        long alertAvgDurationSeconds = (long) windowAlerts.stream()
            .filter(a -> a.getEndedAt() != null)
            .mapToLong(a -> Duration.between(a.getTriggeredAt(), a.getEndedAt()).getSeconds())
            .average()
            .orElse(0);

        // ── Top motifs SOS ──
        Map<String, Long> reasonCounts = windowSos.stream()
            .filter(s -> s.getReasonCode() != null)
            .collect(Collectors.groupingBy(SosAlert::getReasonCode, Collectors.counting()));
        List<TopReasonEntry> topReasons = reasonCounts.entrySet().stream()
            .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
            .limit(6)
            .map(e -> TopReasonEntry.builder().reasonCode(e.getKey()).count(e.getValue()).build())
            .toList();

        // ── Distribution par status ──
        Map<String, Long> sosByStatus = new HashMap<>();
        for (SosStatus s : SosStatus.values()) sosByStatus.put(s.name(), 0L);
        windowSos.forEach(s -> sosByStatus.merge(s.getStatus().name(), 1L, Long::sum));

        // ── Timeline daily counts ──
        List<DailyCountEntry> sosDaily = buildDailyTimeline(
            windowSos.stream().map(SosAlert::getTriggeredAt).toList(),
            windowDays
        );
        List<DailyCountEntry> alertDaily = buildDailyTimeline(
            windowAlerts.stream().map(GeneralAlert::getTriggeredAt).toList(),
            windowDays
        );

        // ── Top coordinateurs (qui a fait le plus d'ack/dispatch) ──
        Map<Long, Long> coordCounts = windowSos.stream()
            .filter(s -> s.getCoordinatorId() != null)
            .collect(Collectors.groupingBy(SosAlert::getCoordinatorId, Collectors.counting()));
        List<TopActorEntry> topCoords = coordCounts.entrySet().stream()
            .sorted(Comparator.comparing(Map.Entry<Long, Long>::getValue).reversed())
            .limit(5)
            .map(e -> TopActorEntry.builder().actorId(e.getKey()).count(e.getValue()).build())
            .toList();

        // ── Positions GPS récentes (limit 30 plus récentes) ──
        List<SosLocationEntry> recentLocations = windowSos.stream()
            .filter(s -> s.getLatitude() != null && s.getLongitude() != null)
            .limit(30)
            .map(s -> SosLocationEntry.builder()
                .id(s.getId())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .status(s.getStatus().name())
                .reasonCode(s.getReasonCode())
                .triggeredAt(s.getTriggeredAt() != null ? s.getTriggeredAt().toString() : null)
                .build())
            .toList();

        return EmergencyDashboardDTO.builder()
            .companyId(companyId)
            .windowDays(windowDays)
            .sosTotal(sosTotal)
            .sosActive(sosActive)
            .sosClosed(sosClosed)
            .sosFalseAlarm(sosFalseAlarm)
            .sosClosedReal(sosClosed)
            .sosAvgResolutionSeconds(sosAvgResolutionSeconds)
            .sosAvgAckSeconds(sosAvgAckSeconds)
            .generalAlertsTotal(alertsTotal)
            .generalAlertsActive(alertsActive)
            .generalAlertsDrills(alertsDrills)
            .generalAlertsReal(alertsReal)
            .generalAlertAvgDurationSeconds(alertAvgDurationSeconds)
            .topReasonsSos(topReasons)
            .sosByStatus(sosByStatus)
            .sosDailyCounts(sosDaily)
            .generalAlertDailyCounts(alertDaily)
            .topCoordinators(topCoords)
            .recentSosLocations(recentLocations)
            .generatedAt(LocalDateTime.now(ZoneOffset.UTC).toString())
            .build();
    }

    /**
     * Construit une série temporelle "comptage par jour" sur la fenêtre.
     * Remplit les jours sans événement avec 0 pour avoir une ligne continue.
     */
    private List<DailyCountEntry> buildDailyTimeline(
        List<LocalDateTime> timestamps, int windowDays
    ) {
        // TreeMap pour tri chronologique
        Map<LocalDate, Long> byDate = new TreeMap<>();
        LocalDate today = LocalDate.now();
        for (int i = windowDays - 1; i >= 0; i--) {
            byDate.put(today.minusDays(i), 0L);
        }
        for (LocalDateTime ts : timestamps) {
            if (ts == null) continue;
            LocalDate d = ts.toLocalDate();
            byDate.computeIfPresent(d, (k, v) -> v + 1);
        }
        List<DailyCountEntry> result = new ArrayList<>(byDate.size());
        byDate.forEach((d, c) -> result.add(
            DailyCountEntry.builder().date(d).count(c).build()
        ));
        return result;
    }
}
