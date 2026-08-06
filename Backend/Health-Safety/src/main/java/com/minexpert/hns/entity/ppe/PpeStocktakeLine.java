package com.minexpert.hns.entity.ppe;

import com.minexpert.hns.dto.ppe.PpeStocktakeLineDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ligne d'inventaire physique : un EPI compté dans une session {@link PpeStocktake}.
 *
 * {@code systemQuantity} est FIGÉ au moment du comptage (photo du stock système) ; il
 * ne recalcule pas après coup, sinon l'écart mesuré perdrait son sens. L'écart
 * {@code countedQuantity - systemQuantity} est ce que la validation passe en ajustement.
 */
@Entity
@Table(name = "ppe_stocktake_line", indexes = {
        @Index(name = "idx_ppe_stocktake_line_take", columnList = "stocktake_id"),
        @Index(name = "idx_ppe_stocktake_line_ppe", columnList = "ppe_id")
})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeStocktakeLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Session d'inventaire (référence par id, sans relation JPA). */
    @Column(name = "stocktake_id", nullable = false)
    private Long stocktakeId;

    @Column(name = "ppe_id", nullable = false)
    private Long ppeId;

    /** Stock système figé au moment du comptage (photo). */
    @Column(name = "system_quantity", nullable = false)
    private Integer systemQuantity;

    /** Quantité physiquement comptée sur le terrain. */
    @Column(name = "counted_quantity", nullable = false)
    private Integer countedQuantity;

    /** Observation de ligne (ex. « 2 casques fêlés retirés »). */
    @Column(length = 255)
    private String note;

    /** Écart = compté − système (positif = surplus, négatif = manquant). */
    public int getDifference() {
        int system = systemQuantity != null ? systemQuantity : 0;
        int counted = countedQuantity != null ? countedQuantity : 0;
        return counted - system;
    }

    public PpeStocktakeLineDTO toDTO() {
        return PpeStocktakeLineDTO.builder()
                .id(id)
                .stocktakeId(stocktakeId)
                .ppeId(ppeId)
                .systemQuantity(systemQuantity)
                .countedQuantity(countedQuantity)
                .difference(getDifference())
                .note(note)
                .build();
    }
}
