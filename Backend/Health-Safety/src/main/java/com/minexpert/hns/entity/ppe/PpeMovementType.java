package com.minexpert.hns.entity.ppe;

/**
 * Type d'un mouvement de stock EPI (journal immuable {@code ppe_stock_movement}).
 *
 * Le stock d'un EPI n'est plus une valeur mutée en direct : c'est la SOMME de ses
 * mouvements. Chaque variation en porte un, ce qui rend le stock reconstituable et
 * auditable (correction de la dérive constatée en production le 2026-08-05, où
 * l'agrégat {@code ppe.stock} divergeait de la somme des entrées, les sorties
 * n'ayant jamais été enregistrées).
 */
public enum PpeMovementType {
    /** Solde d'ouverture, posé à la mise en place du journal (backfill). */
    INITIAL,
    /** Réception fournisseur / entrée de stock. Quantité positive. */
    RECEIPT,
    /** Sortie pour distribution (approbation d'une demande). Quantité négative. */
    ISSUE,
    /** Retour d'un EPI en stock (réservé aux incréments ultérieurs). */
    RETURN,
    /** Ajustement manuel (inventaire, perte…). Signe selon le sens. */
    ADJUSTMENT,
    /** Correction d'une entrée de stock éditée a posteriori. Signe selon le delta. */
    CORRECTION
}
