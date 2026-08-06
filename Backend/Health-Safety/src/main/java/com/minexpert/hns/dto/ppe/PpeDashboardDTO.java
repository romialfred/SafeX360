package com.minexpert.hns.dto.ppe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Synthèse décisionnelle du module EPI (incrément 6) : valorisation du stock,
 * flux (réceptions / distributions / retours / ajustements) valorisés sur une
 * période, et EPI les plus consommés. Calculé à partir du JOURNAL de mouvements
 * et des prix de référence — cloisonné par mine.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeDashboardDTO {

    /** Valeur totale du stock actuel = Σ(stock × prix de référence). */
    private double stockValueTotal;
    /** Devise dominante du parc (indicative pour l'affichage). */
    private String currency;

    private int totalReferences;
    private long totalUnitsInStock;
    private int lowStockCount;
    private int outOfStockCount;

    /** Valorisation ventilée par catégorie. */
    private List<CategoryValue> valueByCategory;
    /** Flux valorisés sur la période (un item par type de mouvement pertinent). */
    private List<MovementStat> movements;
    /** EPI les plus distribués sur la période (quantité + valeur). */
    private List<ConsumedItem> topConsumed;

    /** Écart net d'inventaire sur la période (Σ des ajustements, en unités). */
    private long inventoryAdjustmentUnits;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryValue {
        private String category;
        private long units;
        private double value;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MovementStat {
        /** RECEIPT / ISSUE / RETURN / ADJUSTMENT… */
        private String type;
        /** Quantité en valeur absolue (unités mouvementées). */
        private long quantity;
        private long count;
        private double value;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ConsumedItem {
        private Long ppeId;
        private String name;
        private String category;
        private long quantity;
        private double value;
    }
}
