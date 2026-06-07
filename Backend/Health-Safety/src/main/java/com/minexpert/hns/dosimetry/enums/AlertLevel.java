package com.minexpert.hns.dosimetry.enums;

/**
 * Niveau de criticite d'une alerte d'exposition.
 *  - APPROACH      : approche d'un seuil (ex. 75% ou 90%)
 *  - INVESTIGATION : niveau d'investigation atteint
 *  - ACTION        : niveau d'action atteint
 *  - EXCEEDED      : limite reglementaire depassee
 */
public enum AlertLevel {
    APPROACH,
    INVESTIGATION,
    ACTION,
    EXCEEDED
}
