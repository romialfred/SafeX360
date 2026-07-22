package com.minexpert.hns.enums;

/**
 * Nature d'une notification SLA du moteur de surveillance HSE (ISO 45001 §9.1 —
 * surveillance de la performance ; §10.2 — délais de traitement des actions).
 */
public enum HseNotificationType {
    /** Action corrective dont l'échéance approche (fenêtre « bientôt due »). */
    ACTION_DUE_SOON,
    /** Action corrective dont l'échéance est dépassée (SLA rompu). */
    ACTION_OVERDUE,
    /** Action corrective en retard prolongé — escaladée à la coordination HSE. */
    ACTION_OVERDUE_ESCALATED,
    /** Recommandation d'audit dont l'échéance est dépassée. */
    RECOMMENDATION_OVERDUE,
    /** Recommandation d'audit en retard prolongé — escaladée à la coordination HSE. */
    RECOMMENDATION_OVERDUE_ESCALATED;
}
