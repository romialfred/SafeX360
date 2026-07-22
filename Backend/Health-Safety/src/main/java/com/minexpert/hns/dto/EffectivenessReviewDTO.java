package com.minexpert.hns.dto;

import com.minexpert.hns.enums.EffectivenessVerdict;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Requete de revue d'efficacite d'une action corrective (ISO 45001 10.2 e). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EffectivenessReviewDTO {
    private EffectivenessVerdict verdict;
    private String comment;
    /** Risque residuel apres mesures : probabilite 1..5. */
    private Integer residualProbability;
    /** Risque residuel apres mesures : gravite 1..5. */
    private Integer residualSeverity;
}
