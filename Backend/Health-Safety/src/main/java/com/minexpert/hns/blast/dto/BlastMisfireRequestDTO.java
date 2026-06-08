package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Body de la requete {@code POST /hns/blast/declare-misfire/{id}} (P5).
 *
 * <p>Format JSON canonique :
 * <pre>{ "reason": "Detonateur 12 silencieux, trou 7 intact" }</pre>
 *
 * <p>Le query param {@code ?reason=...} reste accepte pour retrocompatibilite
 * avec les clients deployes avant P5 ; voir
 * {@code BlastController#declareMisfire}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastMisfireRequestDTO {

    /**
     * Raison / description du raté. Obligatoire (validee par
     * {@code BlastService.declareMisfire} qui leve {@code IllegalArgumentException}
     * si null ou blank).
     */
    private String reason;
}
