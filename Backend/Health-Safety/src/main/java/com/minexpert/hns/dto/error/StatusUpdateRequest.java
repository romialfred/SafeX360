package com.minexpert.hns.dto.error;

import com.minexpert.hns.enums.ErrorEventStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de requete pour une transition d'etat d'un evenement erreur.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatusUpdateRequest {
    private ErrorEventStatus toStatus;
    /** Acteur de la transition (null autorise pour acteur systeme/anonyme). */
    private Long actorId;
    private String actorLabel;
    private String comment;
}
