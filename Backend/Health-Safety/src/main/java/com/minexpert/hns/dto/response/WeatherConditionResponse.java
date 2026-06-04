package com.minexpert.hns.dto.response;

import com.minexpert.hns.enums.Status;

public interface WeatherConditionResponse {
    Long getId();

    String getName();

    String getDescription();

    Long getCompanyId();

    Status getStatus();
}
