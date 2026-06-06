package com.minexpert.hns.api.emergency.enums;

/**
 * États du cycle de vie d'un SOS (LOT 48 Phase 3.a).
 *
 * <p>Machine à état linéaire avec branchement final :</p>
 * <pre>
 *   RECEIVED → ACKNOWLEDGED → DISPATCHED → ON_SITE → CLOSED
 *                                                  ↘ FALSE_ALARM
 *                                ↘ FALSE_ALARM (avant dispatch)
 * </pre>
 *
 * <p>Transitions autorisées contrôlées côté service. Toute autre transition
 * lève une {@link IllegalStateException} pour préserver l'intégrité du flux.</p>
 */
public enum SosStatus {
    /** L'alerte vient d'être créée par l'employé (mobile/web). */
    RECEIVED,
    /** Le coordinateur a accusé réception (popup fermée). */
    ACKNOWLEDGED,
    /** Une équipe de secours a été assignée. */
    DISPATCHED,
    /** L'équipe est arrivée sur place. */
    ON_SITE,
    /** L'incident est clôturé (employé sécurisé). */
    CLOSED,
    /** L'alerte est annulée (fausse alerte). */
    FALSE_ALARM
}
