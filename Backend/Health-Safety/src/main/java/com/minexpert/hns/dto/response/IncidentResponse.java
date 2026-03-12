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
}
