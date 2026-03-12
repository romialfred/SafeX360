package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.RecommendationDTO;
import com.minexpert.hns.dto.audit.RecommendationDetails;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.exception.HSException;

public interface RecommendationService {
    public Long createRecommendation(RecommendationDTO recommendationDTO) throws HSException;

    public List<Long> createRecommendations(List<RecommendationDTO> recommendationDTOs) throws HSException;

    public void updateRecommendation(RecommendationDTO recommendationDTO) throws HSException;

    public RecommendationDTO getRecommendation(Long id) throws HSException;

    public List<RecommendationDTO> getRecommendationsByAuditId(Long auditId) throws HSException;

    public List<RecommendationDetails> getAllRecommendationDetails() throws HSException;

    public List<RecommendationDetails> getRecommendationDetailsByStatus(RecommendationStatus status) throws HSException;
}
