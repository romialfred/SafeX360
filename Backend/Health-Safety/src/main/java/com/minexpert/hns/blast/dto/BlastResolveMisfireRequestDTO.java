package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Body de la requete {@code POST /hns/blast/resolve-misfire/{id}} (P5).
 *
 * <p>Format JSON canonique :
 * <pre>{ "resolutionNotes": "Trou 7 contre-mine manuelle 14:25" }</pre>
 *
 * <p>Pour retrocompatibilite avec les clients deployes avant P5, le champ
 * {@code reason} (alias historique) reste accepte et est traite comme
 * notes de resolution. Voir {@code BlastController#resolveMisfire}.
 *
 * <p>Le texte est persiste dans {@code blast.misfire_resolution_notes}
 * (V017, P5) ET trace dans {@code blast_status_event} (append-only).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastResolveMisfireRequestDTO {

    /**
     * Notes de resolution : description du protocole d'intervention applique
     * (deminage manuel, re-amorcage du trou défaillant, contre-mine, etc.).
     * Optionnel mais fortement recommande pour audit reglementaire.
     */
    private String resolutionNotes;

    /**
     * Alias historique de {@link #resolutionNotes} (clients pre-P5). Si
     * {@code resolutionNotes} est null, ce champ est utilise a sa place.
     */
    private String reason;
}
