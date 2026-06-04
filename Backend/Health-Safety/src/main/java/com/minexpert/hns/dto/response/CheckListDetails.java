package com.minexpert.hns.dto.response;

import com.minexpert.hns.enums.Status;

public interface CheckListDetails {
    public Long getId();

    public String getName();

    public String getDescription();

    public Long getIncidentCategoryId();

    public String getIncidentCategoryName();

    public Status getStatus();

    public Long getCompanyId();

}
