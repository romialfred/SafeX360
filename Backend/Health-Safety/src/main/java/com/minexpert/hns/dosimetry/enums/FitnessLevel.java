package com.minexpert.hns.dosimetry.enums;

/**
 * Niveau d'aptitude medicale a un poste expose aux rayonnements ionisants.
 *
 * <p>Reference : AIEA GSR Part 3 §3.105 / Code du travail R.4451-82.
 *
 * <ul>
 *   <li>{@link #FIT} : apte sans restriction. Affectation libre.</li>
 *   <li>{@link #FIT_WITH_RESTRICTIONS} : apte avec restrictions documentees (zones, duree,
 *       grossesse...). Les details cliniques sont chiffres ; un resume public non-medical
 *       est fourni au PCR/RPO.</li>
 *   <li>{@link #TEMPORARILY_UNFIT} : inapte temporaire avec une date de revue
 *       ({@code reviewRequiredDate}).</li>
 *   <li>{@link #UNFIT} : inaptitude definitive au poste expose. Doit declencher un
 *       processus RH (mutation, reclassement).</li>
 * </ul>
 */
public enum FitnessLevel {
    FIT,
    FIT_WITH_RESTRICTIONS,
    TEMPORARILY_UNFIT,
    UNFIT
}
