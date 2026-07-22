package com.minexpert.hns.enums;

/**
 * Priorité d'une action corrective : P1 (élevée) → P3 (faible). Sans elle, une
 * action P1 en retard est indistinguable d'une P3 dans les listes et alertes.
 */
public enum ActionPriority {
    P1,
    P2,
    P3
}
