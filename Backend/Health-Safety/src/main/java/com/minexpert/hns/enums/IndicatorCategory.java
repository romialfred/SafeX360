package com.minexpert.hns.enums;

/**
 * Categorie ISO 45001 d'un indicateur HSE.
 * LEADING   : indicateur proactif (precede l'evenement) - ex. taux de remontee des presqu'accidents.
 * LAGGING   : indicateur reactif (mesure les consequences) - ex. LTIFR, TRIR.
 * COMMUNITY : indicateur d'engagement communautaire / parties prenantes.
 */
public enum IndicatorCategory {
    LEADING,
    LAGGING,
    COMMUNITY
}
