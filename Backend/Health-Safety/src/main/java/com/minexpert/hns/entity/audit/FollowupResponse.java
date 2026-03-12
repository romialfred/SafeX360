package com.minexpert.hns.entity.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.enums.RecommendationStatus;

public interface FollowupResponse {
    Long getId();

    LocalDateTime getFollowupDate();

    String getComment();

    Integer getProgress();

    RecommendationStatus getStatus();

    Long getRecommendationId();

}
