package com.minexpert.hns.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AICheckpointProposal — Proposition de constat générée par l'IA pour un
 * point de contrôle d'inspection, à partir d'une photo terrain.
 *
 * <p>L'IA ne se prononce que sur les checkpoints réellement observables sur
 * la photo ({@code observable=true}). La proposition pré-remplit le
 * formulaire d'exécution côté frontend : l'inspecteur reste seul maître de
 * la validation finale (human-in-the-loop, ISO 45001 §9.1.2).</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AICheckpointProposal {

    /** ID du checkpoint concerné (référentiel du template). */
    private Long checkpointId;

    /** Libellé du checkpoint (écho pour affichage sans jointure). */
    private String checkpointLabel;

    /** True si le point est réellement évaluable sur la photo fournie. */
    private boolean observable;

    /**
     * Valeur brute proposée, au format du responseType :
     * "true"/"false" (BOOLEAN), "GOOD"/"WATCH"/"POOR" (VISUAL_GRADE),
     * valeur numérique lisible (NUMERIC_RANGE), texte court (FREE_TEXT).
     * Null si non observable ou non mesurable sur photo.
     */
    private String proposedRawValue;

    /** Conformité proposée : CONFORM | WATCH | NON_CONFORM | NOT_APPLICABLE. */
    private String proposedConformity;

    /** Ce que l'IA a réellement observé sur la photo pour ce point. */
    private String observation;

    /** Confiance de l'IA sur CE point précis (0.0 à 1.0). */
    private double confidence;
}
