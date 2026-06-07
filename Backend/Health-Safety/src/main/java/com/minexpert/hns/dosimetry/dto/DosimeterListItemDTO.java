package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Projection legere d'un dosimetre pour la liste / le tableau de parc.
 *
 * <p>Inclut le porteur courant (workerId + nom resolu si dispo) et un compteur de jours jusqu'a
 * la prochaine echeance d'etalonnage (negatif si depasse, null si calibrationDueDate inconnue).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimeterListItemDTO {

    private Long id;

    private String serial;

    private DosimeterType type;

    private String qrCode;

    private DosimeterStatus status;

    /** Travailleur porteur courant (assignment actif), null si AVAILABLE ou autres etats sans porteur. */
    private Long currentWorkerId;

    /** Nom complet du porteur courant, si l'enrichissement RH est disponible (sinon null). */
    private String currentWorkerName;

    private LocalDate calibrationDueDate;

    /**
     * Nombre de jours jusqu'a la prochaine echeance d'etalonnage (positif = a venir, 0 = aujourd'hui,
     * negatif = depasse). null si {@code calibrationDueDate} est inconnue.
     */
    private Integer daysToCalibration;
}
