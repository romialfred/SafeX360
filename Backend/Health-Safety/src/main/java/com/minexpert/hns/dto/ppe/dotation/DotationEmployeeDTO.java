package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/** Ligne du tableau « Suivi des dotations EPI » — conformité d'un employé. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationEmployeeDTO {
    private Long empId;
    private String matricule;
    private String name;
    private String department;
    private String position;

    private int compliancePct;
    private int requiredCount;
    private int satisfiedCount;

    /** État par catégorie exigée (icônes du tableau). */
    private List<DotationCategoryStateDTO> categories;

    private LocalDate nextRenewalDate;
    private Integer nextRenewalDays;  // jours avant le prochain renouvellement
    private LocalDate lastDotationDate;

    /** CONFORME / A_COMPLETER / A_RENOUVELER / CRITIQUE / NON_EVALUE */
    private String status;
}
