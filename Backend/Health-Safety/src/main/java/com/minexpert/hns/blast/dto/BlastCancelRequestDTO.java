package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Body de la requete {@code POST /hns/blast/cancel/{id}} (P5).
 *
 * <p>Format JSON canonique :
 * <pre>{ "reason": "Site evac issue" }</pre>
 *
 * <p>Le query param {@code ?reason=...} reste accepte pour retrocompatibilite
 * avec les clients deployes avant P5 ; voir
 * {@code BlastController#cancel}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastCancelRequestDTO {

    /**
     * Raison de l'annulation. Obligatoire (validee par
     * {@code BlastService.cancel} qui leve {@code IllegalArgumentException}
     * si null ou blank).
     */
    private String reason;
}
