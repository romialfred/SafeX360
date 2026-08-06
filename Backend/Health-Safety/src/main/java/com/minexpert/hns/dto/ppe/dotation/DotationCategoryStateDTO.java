package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** État d'une exigence de catégorie d'EPI pour un employé (icônes du tableau + volet). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationCategoryStateDTO {
    private String category;       // code backend (ex. « Head protection »)
    private String categoryLabel;  // libellé FR
    /** SATISFIED / DUE / EXPIRED / MISSING */
    private String state;
    private boolean mandatory;
}
