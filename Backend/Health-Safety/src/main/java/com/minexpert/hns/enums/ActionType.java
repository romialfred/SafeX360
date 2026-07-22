package com.minexpert.hns.enums;

/**
 * Nature d'une action (ISO 45001 §10.2) : IMMEDIATE (contention à chaud),
 * CORRECTIVE (traite la cause d'un événement survenu), PREVENTIVE (empêche la
 * survenue d'un événement potentiel).
 */
public enum ActionType {
    IMMEDIATE,
    CORRECTIVE,
    PREVENTIVE
}
