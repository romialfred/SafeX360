package com.minexpert.hns.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

import com.minexpert.hns.enums.InspectionStatus;

// Title,frequency, siteName, startTime, endTime, plannedDate, status

public interface GeneralInspectionResponse {
    Long getId();

    String getTitle();

    Long getActivityId();

    Long getSiteId();

    String getSiteName();

    LocalDate getPlannedDate();

    LocalTime getStartTime();

    LocalTime getEndTime();

    InspectionStatus getStatus();

}
