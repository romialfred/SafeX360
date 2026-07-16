package com.minexpert.hns.dosimetry.dto;

import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Projection legere d'un travailleur expose, optimisee pour la table du Registre.
 *
 * <p>Contient les cumuls dosimetriques (annuel / glissant 5 ans / vie entiere) deja jointures
 * cote repository, plus un {@link #exposureLevel} pre-calcule (GREEN/YELLOW/ORANGE/RED) par
 * le service en fonction du ratio annualHp10 / regulatoryLimit applicable a la categorie de
 * personne du worker.
 *
 * <p>Les champs nominatifs (matricule, fullName, position, department) sont enrichis a partir
 * du module RH cote service. Si l'enrichissement RH est indisponible, ces champs restent null
 * sans bloquer le rendu de la liste.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposedWorkerListItemDTO {

    private Long id;
    private Long employeeId;
    private String matricule;
    private String fullName;
    private String position;
    private String department;

    private DoseCategory category;
    private DoseSpecialStatus specialStatus;

    /** Dose Hp(10) du dernier enregistrement actif (mSv). */
    private Double lastDoseHp10;

    /**
     * Periode du dernier enregistrement actif ("YYYY-MM" mensuel ou "YYYY-Qx" trimestriel),
     * telle que stockee sur {@code DoseRecord#period}. Reste null si le worker n'a aucun
     * enregistrement actif. Utilisee par le front (carte 360-mini du travailleur) pour
     * qualifier la valeur de {@link #lastDoseHp10}.
     */
    private String lastPeriod;

    /** Cumul annuel Hp(10) (mSv). */
    private Double annualHp10;

    /** Cumul glissant 5 ans Hp(10) (mSv). */
    private Double rolling5yHp10;

    /** Cumul vie entiere Hp(10) (mSv). */
    private Double lifetimeHp10;

    /**
     * Niveau d'exposition calcule par ExposedWorkerQueryService :
     * <ul>
     *   <li>GREEN : annualHp10 &lt; 50% de regulatoryLimit</li>
     *   <li>YELLOW : 50-75%</li>
     *   <li>ORANGE : 75-100%</li>
     *   <li>RED : &gt;= 100%</li>
     * </ul>
     * Reste null si le seuil reglementaire n'est pas defini.
     */
    private String exposureLevel;

    /** Resume du suivi medical (ex. "FIT", "FIT_WITH_RESTRICTIONS", "UNFIT", "DUE_SOON"). */
    private String medicalStatus;

    /** Resume des qualifications RP (ex. "VALID", "EXPIRING", "EXPIRED"). */
    private String qualificationStatus;
}
