package com.minexpert.hns.dosimetry.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Vue Detail 360 d'un dosimetre.
 *
 * <p>Compose le DosimeterDTO de base, l'affectation courante (si presente), l'historique complet
 * des affectations passees et un placeholder pour l'historique d'etalonnage (Phase future, quand
 * une entite CalibrationRecord existera).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimeterDetailDTO {

    private DosimeterDTO dosimeter;

    /** Affectation active (returnAck=false la plus recente). null si dosimetre disponible. */
    private DosimeterAssignmentDTO currentAssignment;

    /** Historique complet des affectations, plus recent en premier. */
    private List<DosimeterAssignmentDTO> history;

    /**
     * Placeholder pour l'historique d'etalonnage (Phase future). Actuellement renvoye comme
     * liste vide en attendant l'entite CalibrationRecord.
     */
    private List<Object> calibrationHistory;
}
