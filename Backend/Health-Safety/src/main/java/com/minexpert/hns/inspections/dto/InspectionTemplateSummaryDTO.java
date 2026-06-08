package com.minexpert.hns.inspections.dto;

import com.minexpert.hns.enums.InspectionTemplateType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Projection legere pour la liste des templates (sans charger tous les
 * checkpoints). Utilisee pour les selecteurs de templates dans le formulaire
 * de planification.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionTemplateSummaryDTO {
    private Long id;
    private String code;
    private String name;
    private InspectionTemplateType type;
    private String scopeRef;
    private Integer estimatedDurationMin;
    private int checkpointCount;
    private Boolean active;
}
