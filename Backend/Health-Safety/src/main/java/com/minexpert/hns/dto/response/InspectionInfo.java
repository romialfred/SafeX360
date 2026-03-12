package com.minexpert.hns.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

import com.minexpert.hns.enums.InspectionStatus;

public interface InspectionInfo {
    Long getId();

    String getTitle();

    String getSiteName();

    String getLocation();

    Long getSiteId();

    LocalTime getStartTime();

    LocalTime getEndTime();

    LocalDate getPlannedDate();

    InspectionStatus getStatus();

}
