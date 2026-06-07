package com.minexpert.hns.dosimetry.enums;

/**
 * Cycle de vie operationnel d'un dosimetre dans le parc.
 */
public enum DosimeterStatus {
    AVAILABLE,
    ASSIGNED,
    IN_READING,
    LOST,
    DAMAGED,
    RETIRED
}
