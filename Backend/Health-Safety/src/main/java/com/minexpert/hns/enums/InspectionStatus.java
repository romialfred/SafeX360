package com.minexpert.hns.enums;

/**
 * Statuts d'une inspection HSE — workflow complet de planification à archivage.
 *
 * <p><b>Workflow (refonte 2026-06) :</b></p>
 * <pre>
 *   SCHEDULED  (planifiee)
 *      ↓ debut realisation terrain
 *   IN_PROGRESS (en cours, saisie sur mobile/tablette)
 *      ↓ inspecteur soumet pour validation equipe
 *   SUBMITTED  (en attente d'approbation)
 *      ↓ approbations recoltees
 *   APPROVED   (validee par l'equipe → rapport fige) ──→  ARCHIVED
 *      OU
 *   REJECTED   (rejetee, retour IN_PROGRESS possible)
 * </pre>
 *
 * <p><b>Compatibilite ascendante :</b> les anciens statuts PENDING / COMPLETED /
 * CANCELLED restent valides pour les inspections legacy creees avant la refonte.
 * Mapping conceptuel :
 * <ul>
 *   <li>PENDING → equivalent SCHEDULED (planifiee non demarree)</li>
 *   <li>COMPLETED → equivalent APPROVED (cloturee)</li>
 *   <li>CANCELLED → reste CANCELLED</li>
 * </ul></p>
 */
public enum InspectionStatus {
    // ── Statuts legacy (preserves pour les inspections existantes) ──
    PENDING,
    COMPLETED,
    CANCELLED,

    // ── Nouveau workflow (refonte 2026-06) ──
    SCHEDULED,
    IN_PROGRESS,
    SUBMITTED,
    APPROVED,
    REJECTED,
    ARCHIVED
}
