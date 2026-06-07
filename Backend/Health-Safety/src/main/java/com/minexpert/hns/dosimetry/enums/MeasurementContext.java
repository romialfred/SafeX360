package com.minexpert.hns.dosimetry.enums;

/**
 * Contexte operationnel d'une mesure d'ambiance.
 *
 * <ul>
 *   <li>{@link #ROUTINE} : releve periodique programme.</li>
 *   <li>{@link #CAMPAIGN} : releve dans le cadre d'une campagne ciblee.</li>
 *   <li>{@link #INCIDENT_RESPONSE} : intervention post-incident / suspicion contamination.</li>
 *   <li>{@link #COMMISSIONING} : mise en service / etat initial d'une nouvelle zone.</li>
 * </ul>
 */
public enum MeasurementContext {
    ROUTINE,
    CAMPAIGN,
    INCIDENT_RESPONSE,
    COMMISSIONING
}
