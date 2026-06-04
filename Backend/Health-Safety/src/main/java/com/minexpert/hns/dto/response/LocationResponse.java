package com.minexpert.hns.dto.response;

import com.minexpert.hns.enums.Status;

public interface LocationResponse {
    Long getId();

    String getName();

    Double getLongitude();

    Double getLatitude();

    Status getStatus();

    Long getCompanyId();
}
