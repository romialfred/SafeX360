package com.minexpert.hns.dto.response;


public interface InspectionChecklistResponse {
    Long getId();

    String getChecklistName();

    String getChecklistId();

    String getStatus();

    String getFrequency();

    String getSiteName();

    String getInspectionTitle();

    String getCreatedBy();

    String getCreatedDate();

    String getUpdatedBy();

    String getUpdatedDate();
}
