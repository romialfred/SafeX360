package com.minexpert.hns.api.emergency.enums;

/**
 * Émetteur d'un message de liaison d'une alerte générale (salle de crise).
 *
 * <ul>
 *   <li>{@code CONTROL_ROOM} — le centre de contrôle / coordinateur.</li>
 *   <li>{@code RESCUE_TEAM} — une équipe de secours sur le terrain.</li>
 *   <li>{@code SYSTEM} — entrées automatiques (jalons, notifications).</li>
 * </ul>
 */
public enum AlertMessageSender {
    CONTROL_ROOM,
    RESCUE_TEAM,
    SYSTEM
}
