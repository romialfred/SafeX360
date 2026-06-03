package com.minexpert.hns.service.nonConformity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.nonConformity.NcHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.nonConformity.NcHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NcHistoryServiceImpl implements NcHistoryService {
    private final NcHistoryRepository ncHistoryRepository;
    private final NonConformityService nonConformityService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "ncHistoryByNonConformity", key = "#ncHistoryDTO.nonConformityId"),
            @CacheEvict(cacheNames = "nonConformityById", key = "#ncHistoryDTO.nonConformityId"),
            @CacheEvict(cacheNames = "nonConformitiesAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoAll", allEntries = true),
            @CacheEvict(cacheNames = "nonConformityInfoById", key = "#ncHistoryDTO.nonConformityId")
    })
    public Long saveNcHistory(NcHistoryDTO ncHistoryDTO) throws HSException {
        ncHistoryDTO.setCreatedAt(LocalDateTime.now());
        nonConformityService.updateNonConformityStatus(ncHistoryDTO.getNonConformityId(), ncHistoryDTO.getStatus());
        return ncHistoryRepository.save(ncHistoryDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "ncHistoryByNonConformity", key = "#nonConformityId")
    public List<NcHistoryDTO> getNcHistoryByNonConformityId(Long nonConformityId) throws HSException {
        return ncHistoryRepository.findByNonConformityId(nonConformityId);
    }
}
