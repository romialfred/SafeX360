package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/** Fiche détaillée d'un employé (volet latéral droit). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationDetailDTO {
    private Long empId;
    private String matricule;
    private String name;
    private String department;
    private String position;

    private String status;
    private int compliancePct;
    private int requiredCount;
    private int satisfiedCount;

    private List<DotationEquipmentDTO> attributed;   // EPI attribués
    private List<DotationCategoryStateDTO> missing;  // exigences non satisfaites
    private NextAction nextAction;                   // prochaine action

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class NextAction {
        private String ppeName;
        private String category;
        private LocalDate dueDate;
        private Integer days;
        private String priority;  // HAUTE / MOYENNE / BASSE
        private String reason;
    }
}
