package com.minexpert.hns.api.emergency.enums;

/**
 * Permissions du module Gestion des Urgences (LOT 48 Phase 1).
 *
 * <p>Stockées en VARCHAR(40) dans la table {@code emergency_user_permission}.
 * Pas d'intégration à l'enum {@code Role.java} existant pour préserver l'auth
 * globale (ADR-007).</p>
 *
 * <ul>
 *   <li>{@link #COORDINATOR} — peut recevoir les popups SOS, dispatcher les
 *       secours, gérer les évacuations.</li>
 *   <li>{@link #RESPONDER} — membre d'équipe de secours, peut clôturer un SOS.</li>
 *   <li>{@link #ALERT_LAUNCHER} — autorisé à déclencher / arrêter une
 *       <em>Alerte Générale</em>.</li>
 * </ul>
 */
public enum EmergencyPermission {
    COORDINATOR,
    RESPONDER,
    ALERT_LAUNCHER
}
