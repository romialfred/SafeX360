package com.minexpert.hns.api.emergency.enums;

/**
 * État d'un check-in d'évacuation (LOT 48 Phase 4).
 *
 * <p>Un employé pointe sa présence au point de rassemblement et déclare son
 * état :</p>
 * <ul>
 *   <li>{@code SAFE} — en sécurité, en bonne santé</li>
 *   <li>{@code INJURED} — blessé, requiert assistance</li>
 *   <li>{@code MISSING} — déclaré manquant par un tiers</li>
 * </ul>
 */
public enum CheckInStatus {
    SAFE,
    INJURED,
    MISSING
}
