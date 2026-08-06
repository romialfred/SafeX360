package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDashboardDTO;
import com.minexpert.hns.dto.ppe.PpeDashboardDTO.CategoryValue;
import com.minexpert.hns.dto.ppe.PpeDashboardDTO.ConsumedItem;
import com.minexpert.hns.dto.ppe.PpeDashboardDTO.MovementStat;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeMovementType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.ppe.PpeRepository;
import com.minexpert.hns.repository.ppe.PpeStockMovementRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tableau de bord décisionnel EPI (incrément 6). Tout est dérivé du JOURNAL de
 * mouvements et des prix de référence — aucune donnée n'est fabriquée. Les flux sont
 * valorisés au prix de référence de chaque EPI (0 si non renseigné).
 */
@Service
@RequiredArgsConstructor
public class PpeDashboardServiceImpl implements PpeDashboardService {

    private static final int TOP_CONSUMED = 5;

    private final PpeRepository ppeRepository;
    private final PpeStockMovementRepository movementRepository;

    @Override
    public PpeDashboardDTO getDashboard(Long companyId, LocalDate from, LocalDate to) throws HSException {
        LocalDateTime fromTs = from != null ? from.atStartOfDay() : null;
        LocalDateTime toTs = to != null ? to.atTime(LocalTime.MAX) : null;

        List<Ppe> ppes = ppeRepository.findAllByCompany(companyId);
        Map<Long, Ppe> byId = new LinkedHashMap<>();
        for (Ppe p : ppes) {
            byId.put(p.getId(), p);
        }

        // ── Valorisation du stock actuel + ventilation par catégorie ─────────────
        double stockValueTotal = 0d;
        long totalUnits = 0L;
        int lowStock = 0;
        int outOfStock = 0;
        Map<String, long[]> unitsByCat = new LinkedHashMap<>();     // cat -> [units]
        Map<String, double[]> valueByCat = new LinkedHashMap<>();   // cat -> [value]
        String currency = null;

        for (Ppe p : ppes) {
            int stock = p.getStock() != null ? p.getStock() : 0;
            double price = p.getReferencePrice() != null ? p.getReferencePrice() : 0d;
            double value = stock * price;
            stockValueTotal += value;
            totalUnits += stock;
            if (stock <= 0) {
                outOfStock++;
            } else if (p.getMinStock() != null && stock <= p.getMinStock()) {
                lowStock++;
            }
            String cat = p.getCategory() != null ? p.getCategory() : "—";
            unitsByCat.computeIfAbsent(cat, k -> new long[1])[0] += stock;
            valueByCat.computeIfAbsent(cat, k -> new double[1])[0] += value;
            if (currency == null && p.getCurrency() != null && !p.getCurrency().isBlank()) {
                currency = p.getCurrency();
            }
        }

        List<CategoryValue> categoryValues = new ArrayList<>();
        for (String cat : unitsByCat.keySet()) {
            categoryValues.add(CategoryValue.builder()
                    .category(cat)
                    .units(unitsByCat.get(cat)[0])
                    .value(round2(valueByCat.get(cat)[0]))
                    .build());
        }
        categoryValues.sort(Comparator.comparingDouble(CategoryValue::getValue).reversed());

        // ── Flux valorisés par type, sur la période ──────────────────────────────
        List<MovementStat> movements = new ArrayList<>();
        for (PpeMovementType type : List.of(PpeMovementType.RECEIPT, PpeMovementType.ISSUE,
                PpeMovementType.RETURN, PpeMovementType.ADJUSTMENT)) {
            List<Object[]> rows = movementRepository.sumByPpeForType(type, companyId, fromTs, toTs);
            long qty = 0L;
            double value = 0d;
            for (Object[] r : rows) {
                long signed = r[1] != null ? ((Number) r[1]).longValue() : 0L;
                long abs = Math.abs(signed);
                qty += abs;
                value += abs * priceOf(byId, (Long) r[0]);
            }
            movements.add(MovementStat.builder()
                    .type(type.name())
                    .quantity(qty)
                    .count(rows.size())
                    .value(round2(value))
                    .build());
        }

        // ── Top EPI distribués (à partir des ISSUE) ──────────────────────────────
        List<Object[]> issued = movementRepository.sumByPpeForType(
                PpeMovementType.ISSUE, companyId, fromTs, toTs);
        List<ConsumedItem> topConsumed = new ArrayList<>();
        for (Object[] r : issued) {
            Long ppeId = (Long) r[0];
            long abs = r[1] != null ? Math.abs(((Number) r[1]).longValue()) : 0L;
            if (abs == 0) {
                continue;
            }
            Ppe p = byId.get(ppeId);
            topConsumed.add(ConsumedItem.builder()
                    .ppeId(ppeId)
                    .name(p != null ? p.getName() : ("#" + ppeId))
                    .category(p != null ? p.getCategory() : null)
                    .quantity(abs)
                    .value(round2(abs * priceOf(byId, ppeId)))
                    .build());
        }
        topConsumed.sort(Comparator.comparingLong(ConsumedItem::getQuantity).reversed());
        if (topConsumed.size() > TOP_CONSUMED) {
            topConsumed = new ArrayList<>(topConsumed.subList(0, TOP_CONSUMED));
        }

        // ── Écart net d'inventaire (Σ des ajustements signés) ────────────────────
        long adjustmentUnits = 0L;
        for (Object[] r : movementRepository.sumByPpeForType(
                PpeMovementType.ADJUSTMENT, companyId, fromTs, toTs)) {
            adjustmentUnits += r[1] != null ? ((Number) r[1]).longValue() : 0L;
        }

        return PpeDashboardDTO.builder()
                .stockValueTotal(round2(stockValueTotal))
                .currency(currency)
                .totalReferences(ppes.size())
                .totalUnitsInStock(totalUnits)
                .lowStockCount(lowStock)
                .outOfStockCount(outOfStock)
                .valueByCategory(categoryValues)
                .movements(movements)
                .topConsumed(topConsumed)
                .inventoryAdjustmentUnits(adjustmentUnits)
                .build();
    }

    private static double priceOf(Map<Long, Ppe> byId, Long ppeId) {
        Ppe p = byId.get(ppeId);
        return p != null && p.getReferencePrice() != null ? p.getReferencePrice() : 0d;
    }

    private static double round2(double v) {
        return Math.round(v * 100d) / 100d;
    }
}
