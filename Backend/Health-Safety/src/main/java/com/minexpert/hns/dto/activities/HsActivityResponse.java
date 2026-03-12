package com.minexpert.hns.dto.activities;

import java.time.LocalDate;
import java.time.LocalTime;

import com.minexpert.hns.enums.ActivityType;

public interface HsActivityResponse {
    Long getId();

    String getTitle();

    Long getActivityId();

    ActivityType getType();

    String getLocation();

    LocalDate getPlannedDate();

    LocalTime getStartTime();

    LocalTime getEndTime();

    String getStatus();

}
