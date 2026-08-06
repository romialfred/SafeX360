package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeMonitoringDTO;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.Alert;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.DeptDistribution;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.HealthBreakdown;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.MonthPoint;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.Rotation;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.ValueSplit;
import com.minexpert.hns.dto.ppe.PpeMonitoringDTO.WatchItem;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.entity.ppe.PpeRequest;
import com.minexpert.hns.entity.ppe.PpeRequestStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeEmpRepository;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeRequestRepository;
import com.minexpert.hns.repository.ppe.PpeStockMovementRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Tableau de bord « Suivi des EPI ». Tout est dérivé du catalogue, du JOURNAL de
 * mouvements et des demandes réelles — cloisonné par mine, aucune donnée fabriquée.
 */
@Service
@RequiredArgsConstructor
public class PpeMonitoringServiceImpl implements PpeMonitoringService {

    private static final int DORMANT_DAYS = 90;
    private static final int WATCH_LIMIT = 8;
    private static final int ALERT_LIMIT = 6;

    private final PpeRepository ppeRepository;
    private final PpeStockMovementRepository movementRepository;
    private final PpeRequestRepository requestRepository;
    private final PpeEmpRepository empRepository;

    @Override
    public PpeMonitoringDTO getMonitoring(Long companyId, int days) throws HSException {
        int window = days > 0 ? days : 30;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.minusDays(window);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        List<Ppe> ppes = ppeRepository.findAllByCompany(companyId);
        int totalRefs = ppes.size();
        String currency = ppes.stream().map(Ppe::getCurrency)
                .filter(c -> c != null && !c.isBlank()).findFirst().orElse("XOF");

        // Réservations (approuvé non distribué), par EPI.
        Map<Long, Long> reservedByPpe = new HashMap<>();
        for (Object[] r : empRepository.reservedByPpe(companyId)) {
            if (r[0] != null) reservedByPpe.put(((Number) r[0]).longValue(), ((Number) r[1]).longValue());
        }
        long reservedUnits = reservedByPpe.values().stream().mapToLong(Long::longValue).sum();

        // Dernière sortie par EPI → détection du stock dormant.
        Map<Long, LocalDateTime> lastIssue = new HashMap<>();
        for (Object[] r : movementRepository.lastIssueByPpe(companyId)) {
            if (r[0] != null && r[1] != null) lastIssue.put(((Number) r[0]).longValue(), (LocalDateTime) r[1]);
        }

        // Distribution mensuelle par EPI (sur la fenêtre) → conso quotidienne pour la couverture.
        Map<Long, Long> issuedWindow = new HashMap<>();
        for (Object[] r : movementRepository.sumByPpeForType(PpeMovementType.ISSUE, companyId, from, now)) {
            if (r[0] != null) issuedWindow.put(((Number) r[0]).longValue(), Math.abs(((Number) r[1]).longValue()));
        }

        double stockValue = 0, reservedValue = 0, dormantValue = 0, scrapValue = 0, availableValue = 0;
        long availableUnits = 0;
        int healthy = 0, below = 0, out = 0, dormant = 0;
        List<WatchItem> watch = new ArrayList<>();
        List<Alert> alerts = new ArrayList<>();
        Map<String, long[]> catUnits = new LinkedHashMap<>();
        Map<String, double[]> catValue = new LinkedHashMap<>();

        for (Ppe p : ppes) {
            int stock = p.getStock() != null ? p.getStock() : 0;
            double price = p.getReferencePrice() != null ? p.getReferencePrice() : 0d;
            double value = stock * price;
            long reserved = reservedByPpe.getOrDefault(p.getId(), 0L);
            stockValue += value;
            availableUnits += stock;

            boolean isOut = stock <= 0;
            boolean isLow = !isOut && p.getMinStock() != null && stock <= p.getMinStock();
            LocalDateTime li = lastIssue.get(p.getId());
            boolean isDormant = !isOut && (li == null || li.isBefore(now.minusDays(DORMANT_DAYS)));

            if (isOut) out++;
            else if (isLow) below++;
            else healthy++;
            if (isDormant) dormant++;

            reservedValue += reserved * price;
            if (isDormant) dormantValue += value;
            else availableValue += Math.max(0, value - reserved * price);
            if (isOut) scrapValue += 0; // pas de valeur à réformer connue par unité (âge non tracé)

            String cat = p.getCategory() != null ? p.getCategory() : "—";
            catUnits.computeIfAbsent(cat, k -> new long[1])[0] += stock;
            catValue.computeIfAbsent(cat, k -> new double[1])[0] += value;

            // Couverture (jours) = stock / conso quotidienne moyenne sur la fenêtre.
            double dailyUse = issuedWindow.getOrDefault(p.getId(), 0L) / (double) window;
            Integer coverageDays = dailyUse > 0 ? (int) Math.round(stock / dailyUse) : null;
            String status = isOut ? "OUT" : isLow ? "LOW" : "HEALTHY";
            watch.add(WatchItem.builder()
                    .ppeId(p.getId()).name(p.getName()).category(p.getCategory())
                    .available(stock).reserved(reserved).threshold(p.getMinStock())
                    .coverageDays(coverageDays).value(round2(value)).status(status).build());
        }

        // Alertes : ruptures (CRITICAL) puis sous seuil (HIGH), triées par criticité.
        for (Ppe p : ppes) {
            int stock = p.getStock() != null ? p.getStock() : 0;
            if (stock <= 0) {
                alerts.add(Alert.builder().title(p.getName() + " — rupture")
                        .detail(ref(p) + " · " + supplier(p)).severity("CRITICAL").build());
            }
        }
        for (Ppe p : ppes) {
            int stock = p.getStock() != null ? p.getStock() : 0;
            if (stock > 0 && p.getMinStock() != null && stock <= p.getMinStock()) {
                alerts.add(Alert.builder().title(p.getName() + " — sous seuil")
                        .detail(ref(p) + " · reste " + stock + "/" + p.getMinStock()).severity("HIGH").build());
            }
        }
        if (dormant > 0) {
            alerts.add(Alert.builder().title(dormant + " référence(s) en stock dormant")
                    .detail("Aucune sortie depuis plus de " + DORMANT_DAYS + " jours").severity("MEDIUM").build());
        }
        int totalAlerts = alerts.size();
        if (alerts.size() > ALERT_LIMIT) alerts = new ArrayList<>(alerts.subList(0, ALERT_LIMIT));

        // Watchlist : les plus à risque d'abord (rupture, sous seuil, couverture faible), puis par valeur.
        watch.sort(Comparator
                .comparingInt((WatchItem w) -> "OUT".equals(w.getStatus()) ? 0 : "LOW".equals(w.getStatus()) ? 1 : 2)
                .thenComparingInt(w -> w.getCoverageDays() == null ? Integer.MAX_VALUE : w.getCoverageDays()));
        List<WatchItem> topWatch = watch.size() > WATCH_LIMIT ? new ArrayList<>(watch.subList(0, WATCH_LIMIT)) : watch;

        // ── Évolution mensuelle (entrées / sorties / stock cumulé) ──
        TreeMap<YearMonth, long[]> byMonth = new TreeMap<>(); // [entries, issues, netAll]
        for (Object[] r : movementRepository.monthlyByType(companyId)) {
            YearMonth ym = YearMonth.of(((Number) r[0]).intValue(), ((Number) r[1]).intValue());
            PpeMovementType type = (PpeMovementType) r[2];
            long q = r[3] != null ? ((Number) r[3]).longValue() : 0;
            long[] acc = byMonth.computeIfAbsent(ym, k -> new long[3]);
            if (type == PpeMovementType.RECEIPT || type == PpeMovementType.RETURN) acc[0] += q;
            if (type == PpeMovementType.ISSUE) acc[1] += -q;
            acc[2] += q; // net (incl. INITIAL) pour le cumul de stock
        }
        List<MonthPoint> monthly = new ArrayList<>();
        long cumulative = 0;
        for (Map.Entry<YearMonth, long[]> e : byMonth.entrySet()) {
            cumulative += e.getValue()[2];
            monthly.add(MonthPoint.builder()
                    .label(e.getKey().toString())
                    .entries(e.getValue()[0]).issues(e.getValue()[1]).stock(cumulative).build());
        }
        if (monthly.size() > 12) monthly = new ArrayList<>(monthly.subList(monthly.size() - 12, monthly.size()));

        // Tendances mois-sur-mois (à partir des deux derniers mois de la série).
        Double stockTrend = null, distributedTrend = null;
        if (monthly.size() >= 2) {
            MonthPoint last = monthly.get(monthly.size() - 1);
            MonthPoint prev = monthly.get(monthly.size() - 2);
            if (prev.getStock() > 0) stockTrend = round1(100.0 * (last.getStock() - prev.getStock()) / prev.getStock());
            if (prev.getIssues() > 0) distributedTrend = round1(100.0 * (last.getIssues() - prev.getIssues()) / prev.getIssues());
        }

        // Valorisation par catégorie (triée par valeur décroissante).
        List<PpeMonitoringDTO.CategoryValue> valueByCategory = new ArrayList<>();
        for (String cat : catUnits.keySet()) {
            valueByCategory.add(PpeMonitoringDTO.CategoryValue.builder()
                    .category(cat).units(catUnits.get(cat)[0]).value(round2(catValue.get(cat)[0])).build());
        }
        valueByCategory.sort(Comparator.comparingDouble(PpeMonitoringDTO.CategoryValue::getValue).reversed());

        // ── Distributions par département (sur la fenêtre) ──
        List<DeptDistribution> byDept = new ArrayList<>();
        for (Object[] r : movementRepository.distributionByDepartment(companyId, from, now)) {
            String reason = (String) r[0];
            long units = r[1] != null ? Math.abs(((Number) r[1]).longValue()) : 0;
            String dept = reason != null && reason.startsWith("DEPT:") ? reason.substring(5) : "Autres";
            byDept.add(DeptDistribution.builder().department(dept).units(units).build());
        }
        byDept.sort(Comparator.comparingLong(DeptDistribution::getUnits).reversed());

        // ── Distribué ce mois + demandes en attente ──
        long distributedThisMonth = 0;
        for (Object[] r : movementRepository.sumByPpeForType(PpeMovementType.ISSUE, companyId, monthStart, now)) {
            distributedThisMonth += Math.abs(((Number) r[1]).longValue());
        }
        int pending = 0, priorityPending = 0;
        for (PpeRequest req : requestRepository.findAllByCompany(companyId)) {
            if (req.getStatus() == PpeRequestStatus.PENDING) {
                pending++;
                String pr = req.getPriority() == null ? "" : req.getPriority().toUpperCase();
                if (pr.contains("HIGH") || pr.contains("URGENT") || pr.contains("CRITIC") || pr.equals("P1")) priorityPending++;
            }
        }

        // ── Score de santé + rotation + taux de couverture ──
        int score = totalRefs == 0 ? 100
                : (int) Math.round(100.0 * (healthy * 1.0 + below * 0.5 + dormant * 0.3) / totalRefs);
        score = Math.min(100, Math.max(0, score));
        double coverageRate = totalRefs == 0 ? 100 : round1(100.0 * healthy / totalRefs);

        long totalIssuedWindow = issuedWindow.values().stream().mapToLong(Long::longValue).sum();
        double avgStock = availableUnits; // proxy : stock courant
        double avgRotation = avgStock > 0 ? round1(totalIssuedWindow / avgStock * (365.0 / window)) : 0;
        int avgCoverage = (int) Math.round(topWatch.stream().filter(w -> w.getCoverageDays() != null)
                .mapToInt(WatchItem::getCoverageDays).average().orElse(0));

        HealthBreakdown health = HealthBreakdown.builder()
                .score(score).healthy(healthy).belowThreshold(below).outOfStock(out).dormant(dormant).build();
        Rotation rotation = Rotation.builder()
                .avgRotation(avgRotation).dormantValue(round2(dormantValue))
                .dormantPct(stockValue > 0 ? round1(100 * dormantValue / stockValue) : 0)
                .avgCoverageDays(avgCoverage).build();
        ValueSplit valueSplit = ValueSplit.builder()
                .available(round2(availableValue)).reserved(round2(reservedValue))
                .dormant(round2(dormantValue)).toScrap(round2(scrapValue)).build();

        return PpeMonitoringDTO.builder()
                .currency(currency).totalReferences(totalRefs)
                .stockValue(round2(stockValue)).availableUnits(availableUnits).reservedUnits(reservedUnits)
                .criticalCount(out + below).rupturesCount(out).belowThresholdCount(below)
                .distributedThisMonth(distributedThisMonth).pendingRequests(pending).priorityPending(priorityPending)
                .coverageRate(coverageRate).stockTrend(stockTrend).distributedTrend(distributedTrend)
                .monthly(monthly).health(health).byDepartment(byDept).valueByCategory(valueByCategory)
                .alerts(alerts).watchlist(topWatch).rotation(rotation).valueSplit(valueSplit)
                .build();
    }

    private static String ref(Ppe p) {
        return p.getSupplierReference() != null && !p.getSupplierReference().isBlank()
                ? "Réf. " + p.getSupplierReference() : "Réf. #" + p.getId();
    }

    private static String supplier(Ppe p) {
        return p.getPreferredSupplier() != null && !p.getPreferredSupplier().isBlank()
                ? p.getPreferredSupplier() : "Magasin central";
    }

    private static double round2(double v) { return Math.round(v * 100d) / 100d; }
    private static double round1(double v) { return Math.round(v * 10d) / 10d; }
}
