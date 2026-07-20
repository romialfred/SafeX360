package com.minexpert.hns.api.emergency.enums;

/**
 * État d'un check-in d'évacuation (LOT 48 Phase 4).
 *
 * <p>Un employé pointe sa présence au point de rassemblement et déclare son
 * état :</p>
 * <ul>
 *   <li>{@code SAFE} — en sécurité, en bonne santé</li>
 *   <li>{@code INJURED} — blessé, requiert assistance</li>
 *   <li>{@code MISSING} — absent / déclaré manquant par un tiers</li>
 *   <li>{@code NOT_APPLICABLE} — non concerné par l'évacuation (congé, mission
 *       extérieure, repos, hors site) : l'employé est explicitement écarté du
 *       décompte des personnes à retrouver (LOT 63)</li>
 * </ul>
 *
 * <p><strong>Distinction capitale :</strong> l'ABSENCE de ligne
 * {@code EvacuationCheckIn} pour un employé ne signifie pas qu'il est absent,
 * mais qu'il <em>reste à pointer</em>. Confondre les deux ferait passer pour
 * « traité » un employé que personne n'a encore vérifié — c'est précisément le
 * risque que l'appel nominatif doit éliminer.</p>
 */
public enum CheckInStatus {
    SAFE,
    INJURED,
    MISSING,
    NOT_APPLICABLE
}
