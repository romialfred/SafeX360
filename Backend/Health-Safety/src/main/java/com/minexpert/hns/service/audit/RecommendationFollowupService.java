package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.FollowupDTO;
import com.minexpert.hns.entity.audit.FollowupResponse;
import com.minexpert.hns.exception.HSException;

public interface RecommendationFollowupService {
    void addRecommendationFollowup(FollowupDTO followupDTO) throws HSException;

    FollowupDTO getRecommendationFollowupById(Long id) throws HSException;

    List<FollowupResponse> getAllRecommendationFollowupsByRecommendationId(Long recommendationId) throws HSException;

}
