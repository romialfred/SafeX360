package com.minexpert.hns.dosimetry.enums;

/**
 * Statut de traitement d'une alerte d'exposition.
 *  - ACTIVE   : ouverte, non traitee
 *  - ACK      : prise en compte (acknowledged)
 *  - RESOLVED : cloturee
 */
public enum AlertStatus {
    ACTIVE,
    ACK,
    RESOLVED
}
