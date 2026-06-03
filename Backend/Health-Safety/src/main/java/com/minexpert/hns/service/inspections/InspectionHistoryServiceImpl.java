package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.inspections.InspectionHistoryDTO;
import com.minexpert.hns.entity.inspections.InspectionHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspectionHistoryServiceImpl implements InspectionHistoryService {

    private final InspectionHistoryRepository inspectionHistoryRepository;
    private final GeneralInspectionService generalInspectionService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionHistoryByInspection", key = "#inspectionHistoryDTO.inspectionId"),
            // @CacheEvict(cacheNames = "generalInspectionById", key =
            // "#inspectionHistoryDTO.inspectionId"),
            @CacheEvict(cacheNames = "generalInspectionsAll", allEntries = true),
            @CacheEvict(cacheNames = "generalInspectionDetails", key = "#inspectionHistoryDTO.inspectionId"),
            @CacheEvict(cacheNames = "inspectionInfoById", key = "#inspectionHistoryDTO.inspectionId")
    })
    public Long saveInspectionHistory(InspectionHistoryDTO inspectionHistoryDTO) throws HSException {
        inspectionHistoryDTO.setCreatedAt(LocalDateTime.now());
        generalInspectionService.updateInspectionStatus(inspectionHistoryDTO.getInspectionId(),
                inspectionHistoryDTO.getStatus());
        return inspectionHistoryRepository.save(inspectionHistoryDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionHistoryByInspection", key = "#inspectionId")
    public List<InspectionHistoryDTO> getInspectionHistoryByInspectionId(Long inspectionId) throws HSException {
        List<InspectionHistory> histories = inspectionHistoryRepository.findByInspectionId(inspectionId);
        return histories.stream().map(h -> new InspectionHistoryDTO(
                h.getId(),
                h.getOwnerId(),
                h.getDate(),
                h.getStatus(),
                h.getComment(),
                h.getInspection() != null ? h.getInspection().getId() : null,
                h.getCreatedAt())).collect(Collectors.toList());
    }
}
