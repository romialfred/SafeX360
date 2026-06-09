package com.minexpert.hns.dto.response;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.IncidentStatus;

public interface IncidentResponse {
    Long getId();

    String getTitle();

    String getLocation();

    LocalDateTime getIncidentDate();

    LocalDateTime getDiscoveryDate();

    IncidentStatus getStatus();

    Integer getMaxSeverityLevel();

    String getSeverityLevelName();

    String getIncidentCategoryName();

    String getNumber();

    Long getReporterId();

    Long getDepartmentId();

    /**
     * Origine de la declaration : "EMPLOYEE" (saisie directe) ou "AI" (wizard Declaration par IA).
     * Peut etre null pour les enregistrements legacy — le frontend defaultera sur EMPLOYEE.
     */
    String getSource();

    /** Confiance IA (0-1) si source=AI. */
    Double getAiConfidence();
}
