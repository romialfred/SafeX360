package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.FollowupDTO;
import com.minexpert.hns.entity.audit.FollowupResponse;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.audit.RecommendationFollowup;
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
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_FOLLOWUPS_BY_RECOMMENDATION, key = "#followupDTO.recommendationId"),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_BY_ID, key = "#followupDTO.recommendationId"),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATIONS_BY_AUDIT, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_ALL, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_BY_STATUS, allEntries = true)
    })
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
        RecommendationFollowup entity = recommendationFollowupRepository.findById(id)
                .orElseThrow(() -> new HSException("FOLLOWUP_NOT_FOUND"));
        FollowupDTO dto = new FollowupDTO();
        dto.setId(entity.getId());
        dto.setStatus(entity.getStatus());
        dto.setComment(entity.getComment());
        dto.setProgress(entity.getProgress());
        dto.setRecommendationId(entity.getRecommendation().getId());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.RECOMMENDATION_FOLLOWUPS_BY_RECOMMENDATION, key = "#recommendationId")
    public List<FollowupResponse> getAllRecommendationFollowupsByRecommendationId(Long recommendationId)
            throws HSException {
        return recommendationFollowupRepository.findAllRecommendationFollowupsByRecommendationId(recommendationId);
    }

}
