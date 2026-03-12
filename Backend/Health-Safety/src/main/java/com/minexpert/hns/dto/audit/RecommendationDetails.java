package com.minexpert.hns.dto.audit;

import java.time.LocalDate;

import com.minexpert.hns.enums.RecommendationStatus;

public interface RecommendationDetails {
    Long getId();

    String getTitle();

    String getAuditTitle();

    Long getAuditId();

    Long getActionManagerId();

    String getPriority();

    LocalDate getDeadline();

    Integer getProgress();

    RecommendationStatus getStatus();

}
