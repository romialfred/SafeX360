package com.minexpert.hns.api.emergency.enums;

/**
 * État du cycle de vie d'une Alerte Générale (LOT 48 Phase 4).
 *
 * <ul>
 *   <li>{@code ACTIVE} — l'alerte est en cours, sirène + voix TTS jouent,
 *       les employés peuvent pointer leur présence aux points de rassemblement</li>
 *   <li>{@code ENDED} — l'alerte est terminée (fin sirène, employés peuvent
 *       reprendre leur poste)</li>
 * </ul>
 */
public enum GeneralAlertStatus {
    ACTIVE,
    ENDED
}
