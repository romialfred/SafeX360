package com.minexpert.hns.enums;

/**
 * Sens d'amelioration d'un indicateur. Determine si une valeur reelle
 * "atteint" ou "manque" sa cible :
 * LOWER_IS_BETTER  : plus c'est bas, mieux c'est (LTIFR, TRIR, nombre d'accidents).
 *                    Cible atteinte si reel <= cible.
 * HIGHER_IS_BETTER : plus c'est haut, mieux c'est (taux de formation, remontees).
 *                    Cible atteinte si reel >= cible.
 * Sans cette notion, le statut "atteint/depasse" serait faux pour la moitie
 * des indicateurs.
 */
public enum IndicatorDirection {
    LOWER_IS_BETTER,
    HIGHER_IS_BETTER
}
