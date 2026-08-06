package com.minexpert.hns.dto.ppe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ligne d'inventaire côté transport. {@code difference} est calculé (compté − système)
 * et renvoyé au client pour l'affichage ; il n'est pas persisté tel quel.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeStocktakeLineDTO {
    private Long id;
    private Long stocktakeId;
    private Long ppeId;
    private Integer systemQuantity;
    private Integer countedQuantity;
    private Integer difference;
    private String note;
}
