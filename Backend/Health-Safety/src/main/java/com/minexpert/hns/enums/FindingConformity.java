package com.minexpert.hns.enums;

/**
 * Niveau de conformite d'un constat (finding) suite a un point de controle.
 *
 * <p>Calcule automatiquement cote backend a partir de la reponse du
 * checkpoint et de ses parametres (min/max pour NUMERIC, valeur attendue
 * pour BOOLEAN, etc.). L'inspecteur peut surcharger manuellement.</p>
 */
public enum FindingConformity {
    /** Conforme : reponse dans la plage attendue / valeur de reference. */
    CONFORM,
    /** Acceptable mais a surveiller : valeur proche de la limite. */
    WATCH,
    /** Non conforme : valeur hors plage / reponse negative. */
    NON_CONFORM,
    /** Non applicable : le point ne concerne pas la cible inspectee. */
    NOT_APPLICABLE
}
