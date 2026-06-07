package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import com.minexpert.hns.dosimetry.enums.FitnessLevel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO PUBLIC d'une {@link com.minexpert.hns.dosimetry.entity.FitnessAssessment} - SANS
 * donnees cliniques.
 *
 * <p>Destine aux roles PCR_RPO, RH, Manager HSE et au travailleur lui-meme. Expose
 * uniquement :
 * <ul>
 *   <li>le niveau d'aptitude {@code fitness} (necessaire pour autoriser un poste expose) ;</li>
 *   <li>le {@code publicRestrictionsSummary} (resume operationnel non-medical) ;</li>
 *   <li>la date de fin de validite {@code validUntil} (pour declencher une visite avant
 *       echeance) ;</li>
 *   <li>la date de revue obligatoire {@code reviewRequiredDate} et le statut de signature.</li>
 * </ul>
 *
 * <p>Le champ {@code restrictions} (details cliniques chiffres) est volontairement OMIS du
 * DTO pour rendre toute fuite impossible.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitnessAssessmentPublicDTO {

    private Long id;
    private Long workerId;
    private Long mineId;
    private LocalDate assessmentDate;
    private LocalDate validUntil;
    private FitnessLevel fitness;

    /** Resume non-medical (ex. "Eviter zone controlee 6 mois"). */
    private String publicRestrictionsSummary;

    private LocalDate reviewRequiredDate;
    private boolean signed;
}
