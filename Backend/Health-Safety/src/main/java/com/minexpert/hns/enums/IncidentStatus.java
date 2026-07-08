package com.minexpert.hns.enums;

public enum IncidentStatus {
    PENDING, REPORTED, INVESTIGATION, INVESTIGATION_COMPLETED, CORRECTIVE_ACTIONS, CLOSED, REJECTED,
    /**
     * Valeur de LECTURE uniquement — produite par le CASE ... ELSE 'UNKNOWN'
     * des projections natives pour les lignes legacy a status NULL (sans elle,
     * la conversion de la projection jetait ConversionFailedException → 500).
     * Ne jamais persister ; placee en fin d'enum pour preserver les ordinaux 0-6.
     */
    UNKNOWN
}
