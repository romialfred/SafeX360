package com.minexpert.hns.dto.response;

import com.minexpert.hns.enums.Status;

public interface SeverityLevelResponse {
    Long getId();

    String getName();

    String getDescription();

    Long getLevel();

    Long getIncidentCategoryId();

    String getIncidentCategoryName();

    Status getStatus();

}
