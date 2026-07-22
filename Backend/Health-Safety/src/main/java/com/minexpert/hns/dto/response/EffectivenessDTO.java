package com.minexpert.hns.dto.response;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.EffectivenessVerdict;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Etat de la revue d'efficacite d'une action corrective (ISO 45001 10.2 e). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EffectivenessDTO {
    private Long correctiveActionId;
    private ActionStatus status;
    private EffectivenessVerdict verdict;
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String comment;
    private Integer residualProbability;
    private Integer residualSeverity;
    /** true si une revue d'efficacite a deja ete enregistree. */
    private boolean reviewed;
}
