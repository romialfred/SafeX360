package com.minexpert.hns.enums;

/**
 * Cycle de vie d'un evenement erreur (module Gestion des Erreurs).
 * Ordre = progression normale du workflow. REOPENED autorise une regression
 * controlee depuis un etat terminal vers la reprise du traitement.
 */
public enum ErrorEventStatus {
    DECLARED,
    TRIAGED,
    ANALYZING,
    ACTION_PLAN,
    IMPLEMENTING,
    VERIFYING,
    CLOSED,
    CAPITALIZED,
    REOPENED
}
