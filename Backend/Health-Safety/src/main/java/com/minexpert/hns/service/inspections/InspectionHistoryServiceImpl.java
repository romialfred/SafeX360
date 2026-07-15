package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.inspections.InspectionHistoryDTO;
import com.minexpert.hns.entity.inspections.InspectionHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class InspectionHistoryServiceImpl implements InspectionHistoryService {

    private final InspectionHistoryRepository inspectionHistoryRepository;
    private final GeneralInspectionService generalInspectionService;

    @Override
    @Caching(evict = {
            // Clés de cache suffixées par companyId : purge globale sur mutation.
            @CacheEvict(cacheNames = "inspectionHistoryByInspection", allEntries = true),
            @CacheEvict(cacheNames = "generalInspectionsAll", allEntries = true),
            @CacheEvict(cacheNames = "generalInspectionDetails", allEntries = true),
            @CacheEvict(cacheNames = "inspectionInfoById", allEntries = true)
    })
    public Long saveInspectionHistory(InspectionHistoryDTO inspectionHistoryDTO) throws HSException {
        inspectionHistoryDTO.setCreatedAt(LocalDateTime.now());
        generalInspectionService.updateInspectionStatus(inspectionHistoryDTO.getInspectionId(),
                inspectionHistoryDTO.getStatus());
        return inspectionHistoryRepository.save(inspectionHistoryDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionHistoryByInspection", key = "#inspectionId + '-' + #companyId")
    public List<InspectionHistoryDTO> getInspectionHistoryByInspectionId(Long inspectionId, Long companyId)
            throws HSException {
        List<InspectionHistory> histories = inspectionHistoryRepository
                .findByInspectionAndCompany(inspectionId, companyId);
        return histories.stream().map(h -> new InspectionHistoryDTO(
                h.getId(),
                h.getOwnerId(),
                h.getDate(),
                h.getStatus(),
                h.getComment(),
                h.getInspection() != null ? h.getInspection().getId() : null,
                h.getCreatedAt(),
                h.getCompanyId())).collect(Collectors.toList());
    }
}
