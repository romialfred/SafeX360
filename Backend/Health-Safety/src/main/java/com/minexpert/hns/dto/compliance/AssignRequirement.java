package com.minexpert.hns.dto.compliance;

import com.minexpert.hns.enums.Status;

public interface AssignRequirement {
    public Long getId();

    public String getTitle();

    public String getDescription();

    public String getCategory();

    public String getRenewalFrequency();

    public String getDocType();

    public Status getStatus();
}
