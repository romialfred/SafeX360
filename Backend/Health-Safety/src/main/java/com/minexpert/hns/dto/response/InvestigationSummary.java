package com.minexpert.hns.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.InvestigationStatus;

public interface InvestigationSummary {
    Long getId();

    Long getIncidentId();

    String getIncidentTitle();

    String getMethod();

    LocalDateTime getCreatedAt();

    LocalDate getStartDate();

    LocalDate getEndDate();

    InvestigationStatus getStatus();

    Integer getProgress();

    Long getCompanyId();
}