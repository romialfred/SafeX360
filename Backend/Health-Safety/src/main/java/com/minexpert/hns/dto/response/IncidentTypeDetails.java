package com.minexpert.hns.dto.response;

import com.minexpert.hns.enums.Status;

public interface IncidentTypeDetails {
    public Long getId();

    public String getName();

    public String getDescription();

    public Long getIncidentCategoryId();

    public Long getSeverityLevelId();

    public String getSeverityLevelName();

    public Integer getSeverityLevel();

    public String getIncidentCategoryName();

    public Status getStatus();

}
