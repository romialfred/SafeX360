package com.minexpert.hns.blast.enums;

/**
 * Type de tache planifiee pour les rappels et alertes d'un tir.
 *
 * <ul>
 *   <li>{@link #EMAIL_24H} : e-mail de rappel J-1.</li>
 *   <li>{@link #EMAIL_6H} : e-mail de rappel du matin.</li>
 *   <li>{@link #EMAIL_30M} : dernier rappel par e-mail.</li>
 *   <li>{@link #POPUP_15M} : popup web/mobile toutes les 15 min des T-2h.</li>
 *   <li>{@link #GENERAL_ALARM_10M} : declenchement de l'Alerte Generale a T-10 min.</li>
 * </ul>
 */
public enum JobType {
    EMAIL_24H,
    EMAIL_6H,
    EMAIL_30M,
    POPUP_15M,
    GENERAL_ALARM_10M
}
