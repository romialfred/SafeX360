package com.minexpert.hns.dto.response;

import java.time.LocalDate;

import com.minexpert.hns.enums.InspectionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Résumé de la dernière inspection connue pour une cible (équipement, lieu ou
 * procédure). Affiché sous le sélecteur de cible du formulaire d'inspection.
 * {@code null} / 204 si aucune inspection n'existe pour la cible.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LastInspectionDTO {
    private Long id;
    private LocalDate plannedDate;
    private InspectionStatus status;
    private String primaryInspectorName;
    private String templateName;
}
