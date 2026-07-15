package com.minexpert.hns.service.nonConformity;

import java.time.LocalDateTime;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.nonConformity.EventAnalysisDTO;
import com.minexpert.hns.entity.nonConformity.EventAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.nonConformity.EventAnalysisRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class EventAnalysisServiceImpl implements EventAnalysisService {

    private final EventAnalysisRepository eventAnalysisRepository;

    @Override
    @Caching(evict = {
            // Clés composites (id_companyId) côté NC -> éviction globale de ces caches.
            @CacheEvict(cacheNames = "eventAnalysisByNonConformity", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public Long createEventAnalysis(EventAnalysisDTO eventAnalysisDTO) throws HSException {

        if (eventAnalysisRepository.existsByNonConformityId(eventAnalysisDTO.getNonConformityId())) {
            throw new HSException("EVENT_ANALYSIS_ALREADY_EXISTS_FOR_NON_CONFORMITY");
        }
        eventAnalysisDTO.setCreatedAt(LocalDateTime.now());
        eventAnalysisDTO.setUpdatedAt(LocalDateTime.now());
        return eventAnalysisRepository.save(eventAnalysisDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "eventAnalysisByNonConformity", key = "#nonConformityId + '_' + #companyId")
    public EventAnalysisDTO getEventAnalysisByNonConformityId(Long nonConformityId, Long companyId) throws HSException {
        return eventAnalysisRepository.findByNonConformityIdAndCompany(nonConformityId, companyId)
                .orElseThrow(() -> new HSException("EVENT_ANALYSIS_NOT_FOUND_FOR_NON_CONFORMITY")).toDTO();
    }

    @Override
    @Caching(evict = {
            // Clés composites (id_companyId) côté NC -> éviction globale de ces caches.
            @CacheEvict(cacheNames = "eventAnalysisByNonConformity", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityById", allEntries = true),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", allEntries = true)
    })
    public void updateEventAnalysis(EventAnalysisDTO eventAnalysisDTO) throws HSException {
        EventAnalysis eventAnalysis = eventAnalysisRepository.findById(eventAnalysisDTO.getId())
                .orElseThrow(() -> new HSException("EVENT_ANALYSIS_NOT_FOUND"));
        eventAnalysis.updateFromDTO(eventAnalysisDTO);
        eventAnalysis.setUpdatedAt(LocalDateTime.now());
        eventAnalysisRepository.save(eventAnalysis);
    }

}
