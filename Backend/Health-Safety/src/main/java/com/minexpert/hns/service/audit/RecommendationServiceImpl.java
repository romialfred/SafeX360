package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.RecommendationDTO;
import com.minexpert.hns.dto.audit.RecommendationDetails;
import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.RecommendationRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {
    private final RecommendationRepository recommendationRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_BY_ID, key = "#result", condition = "#result != null"),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATIONS_BY_AUDIT, key = "#recommendationDTO.auditId", condition = "#recommendationDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_ALL, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_BY_STATUS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_FOLLOWUPS_BY_RECOMMENDATION, allEntries = true)
    })
    public Long createRecommendation(RecommendationDTO recommendationDTO) throws HSException {
        recommendationDTO.setCreatedAt(LocalDateTime.now());
        recommendationDTO.setUpdatedAt(LocalDateTime.now());
        recommendationDTO.setStatus(RecommendationStatus.PENDING);
        recommendationDTO.setProgress(0);
        return recommendationRepository.save(recommendationDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATIONS_BY_AUDIT, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_ALL, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_BY_STATUS, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.RECOMMENDATION_FOLLOWUPS_BY_RECOMMENDATION, allEntries = true)
    })
    public List<Long> createRecommendations(List<RecommendationDTO> recommendationDTOs) throws HSException {
        recommendationDTOs.forEach(recommendationDTO -> {
            recommendationDTO.setCreatedAt(LocalDateTime.now());
            recommendationDTO.setUpdatedAt(LocalDateTime.now());
            recommendationDTO.setStatus(RecommendationStatus.PENDING);
            recommendationDTO.setProgress(0);
        });
        return ((List<Recommendation>) recommendationRepository
                .saveAll(recommendationDTOs.stream().map(RecommendationDTO::toEntity).toList())).stream()
                .map(Recommendation::getId)
                .toList();
    }

    @Override
    public void updateRecommendation(RecommendationDTO recommendationDTO) throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateRecommendation'");
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.RECOMMENDATION_BY_ID, key = "#id")
    public RecommendationDTO getRecommendation(Long id) throws HSException {
        return recommendationRepository.findById(id).map(Recommendation::toDTO)
                .orElseThrow(() -> new HSException("RECOMMENDATION_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.RECOMMENDATIONS_BY_AUDIT, key = "#auditId")
    public List<RecommendationDTO> getRecommendationsByAuditId(Long auditId) throws HSException {
        return ((List<Recommendation>) recommendationRepository.findByAudit_Id(auditId)).stream()
                .map(Recommendation::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_ALL)
    public List<RecommendationDetails> getAllRecommendationDetails() throws HSException {
        return recommendationRepository.findAllRecommendationDetails();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.RECOMMENDATION_DETAILS_BY_STATUS, key = "#status")
    public List<RecommendationDetails> getRecommendationDetailsByStatus(RecommendationStatus status)
            throws HSException {
        return recommendationRepository.findRecommendationDetailsByStatus(status);
    }

}
