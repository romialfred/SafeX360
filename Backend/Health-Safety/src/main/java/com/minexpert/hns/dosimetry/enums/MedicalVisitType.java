package com.minexpert.hns.dosimetry.enums;

/**
 * Type de visite medicale reglementaire pour un travailleur expose aux rayonnements ionisants.
 *
 * <p>Reference reglementaire :
 * <ul>
 *   <li>{@link #INITIAL} : visite d'embauche / visite d'aptitude initiale, obligatoire avant
 *       toute affectation a un poste expose (AIEA GSR Part 3 §3.105).</li>
 *   <li>{@link #PERIODIC_ANNUAL} : visite annuelle de suivi pour les travailleurs categorie A.
 *       Frequence reduite a 2 ans pour categorie B selon politique locale.</li>
 *   <li>{@link #POST_EXPOSURE} : visite declenchee automatiquement apres ouverture d'un
 *       {@code OverexposureCase} (cf. Phase 5). Doit etre planifiee dans les 7 jours.</li>
 *   <li>{@link #FOLLOWUP} : visite intermediaire de suivi (restrictions levees, controle
 *       grossesse, retour de longue absence...).</li>
 *   <li>{@link #FINAL_AT_DEPARTURE} : visite de sortie a la cessation d'activite a un poste
 *       expose. Sa fiche est archivee 30+ ans (AIEA GSR Part 3 §3.106).</li>
 * </ul>
 */
public enum MedicalVisitType {
    INITIAL,
    PERIODIC_ANNUAL,
    POST_EXPOSURE,
    FOLLOWUP,
    FINAL_AT_DEPARTURE
}
