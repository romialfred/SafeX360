package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload d'ajout d'un incident dans le rapport d'evacuation (P6).
 *
 * <p>Append-only : la chaine {@code description} est concatenee a la fin du
 * champ {@code incidents} avec un horodatage et l'id de l'acteur. Apres
 * signature, toute tentative d'ajout est rejetee.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastEvacuationReportIncidentDTO {

    /** Description libre de l'incident (lieu, victimes, gravite, etc.). */
    private String description;
}
