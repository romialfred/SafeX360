package com.minexpert.hns.entity.ppe;

/**
 * Cycle de vie d'un inventaire physique EPI (comptage contradictoire).
 *
 * DRAFT      : comptage saisi, écarts calculés, mais le stock n'a PAS bougé.
 * VALIDATED  : l'inventaire est clôturé ; les écarts ont été passés en mouvements
 *              d'ajustement (le stock système a été aligné sur le comptage réel).
 * CANCELLED  : brouillon abandonné (aucun effet sur le stock).
 *
 * Append-only pour un stockage @Enumerated(STRING).
 */
public enum PpeStocktakeStatus {
    DRAFT,
    VALIDATED,
    CANCELLED
}
