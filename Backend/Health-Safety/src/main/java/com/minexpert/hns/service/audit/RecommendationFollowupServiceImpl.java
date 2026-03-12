package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.audit.FollowupDTO;
import com.minexpert.hns.entity.audit.FollowupResponse;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.RecommendationFollowupRepository;
import com.minexpert.hns.repository.audit.RecommendationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RecommendationFollowupServiceImpl implements RecommendationFollowupService {
    private final RecommendationFollowupRepository recommendationFollowupRepository;
    private final RecommendationRepository recommendationRepository;

    @Override
    public void addRecommendationFollowup(FollowupDTO followupDTO) throws HSException {
        Recommendation recommendation = recommendationRepository.findById(followupDTO.getRecommendationId())
                .orElseThrow(() -> new HSException("RECOMMENDATION_NOT_FOUND"));

        recommendation.setStatus(followupDTO.getStatus());
        recommendation.setProgress(followupDTO.getProgress());
        recommendationRepository.save(recommendation);
        followupDTO.setCreatedAt(LocalDateTime.now());
        recommendationFollowupRepository.save(followupDTO.toEntity());
    }

    @Override
    public FollowupDTO getRecommendationFollowupById(Long id) throws HSException {
        // return recommendationFollowupRepository.findById(id)
        // .orElseThrow(() -> new HSException("FOLLOWUP_NOT_FOUND"));
        return null;
    }

    @Override
    public List<FollowupResponse> getAllRecommendationFollowupsByRecommendationId(Long recommendationId)
            throws HSException {
        return recommendationFollowupRepository.findAllRecommendationFollowupsByRecommendationId(recommendationId);
    }

}
