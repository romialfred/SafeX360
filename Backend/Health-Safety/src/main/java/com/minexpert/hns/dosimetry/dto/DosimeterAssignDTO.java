package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Requete d'affectation d'un dosimetre a un travailleur (handover).
 *
 * <p>Cree une {@link com.minexpert.hns.dosimetry.entity.DosimeterAssignment} avec handoverAck=true
 * et bascule le statut du dosimetre AVAILABLE -&gt; ASSIGNED. Le service rejette la requete si :
 * <ul>
 *   <li>le dosimetre n'est pas AVAILABLE,</li>
 *   <li>une affectation active existe deja sur ce dosimetre.</li>
 * </ul>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DosimeterAssignDTO {

    @NotNull
    private Long dosimeterId;

    @NotNull
    private Long workerId;

    @NotNull
    private LocalDate periodStart;

    /** Optionnel : date prevue de fin de port. null = indeterminee (longue duree). */
    private LocalDate periodEnd;

    /** Note libre de remise (ex. etat constate, accessoires, instructions au porteur). */
    private String handoverNote;
}
