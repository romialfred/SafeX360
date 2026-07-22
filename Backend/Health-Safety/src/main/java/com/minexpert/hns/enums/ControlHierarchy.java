package com.minexpert.hns.enums;

/**
 * Hiérarchie des mesures de maîtrise (ISO 45001 §8.1.2), de la plus efficace
 * (supprimer le danger) à la moins efficace (protéger l'individu). Un indicateur
 * de maturité HSE : une mine qui traite ses risques par l'ingénierie est plus
 * mûre qu'une mine qui se repose sur l'EPI et les consignes.
 */
public enum ControlHierarchy {
    ELIMINATION,
    SUBSTITUTION,
    ENGINEERING,
    ADMINISTRATIVE,
    PPE
}
