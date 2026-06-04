package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.AreaExecutionDTO;
import com.minexpert.hns.entity.audit.AreaExecution;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AreaExecutionRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AreaExecutionServiceImpl implements AreaExecutionService {
    private final AreaExecutionRepository areaExecutionRepository;
    private final MediaService mediaService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AREA_EXECUTIONS_BY_AREA, key = "#areaExecutionDTO.areaId", condition = "#areaExecutionDTO.areaId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_EXECUTION_BY_ID, key = "#result", condition = "#result != null")
    })
    public Long createAreaExecution(AreaExecutionDTO areaExecutionDTO) {
        areaExecutionDTO.setCreatedAt(LocalDateTime.now());
        areaExecutionDTO.setUpdatedAt(LocalDateTime.now());
        AreaExecution areaExecution = areaExecutionDTO.toEntity();
        areaExecution.setEvidence(mediaService.saveAllMedia(areaExecutionDTO.getEvidence()));
        return areaExecutionRepository.save(areaExecution).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AREA_EXECUTIONS_BY_AREA, allEntries = true),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_EXECUTION_BY_ID, allEntries = true)
    })
    public List<Long> createAreaExecutionList(List<AreaExecutionDTO> areaExecutionDTOs) {
        areaExecutionDTOs.forEach(areaExecutionDTO -> {
            areaExecutionDTO.setCreatedAt(LocalDateTime.now());
            areaExecutionDTO.setUpdatedAt(LocalDateTime.now());
            AreaExecution areaExecution = areaExecutionDTO.toEntity();
            areaExecution.setEvidence(mediaService.saveAllMedia(areaExecutionDTO.getEvidence()));
            areaExecutionDTO.setId(areaExecutionRepository.save(areaExecution).getId());
        });
        return areaExecutionDTOs.stream().map(AreaExecutionDTO::getId).toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AREA_EXECUTION_BY_ID, key = "#id")
    public AreaExecutionDTO getAreaExecution(Long id) throws HSException {
        return areaExecutionRepository.findById(id).map(AreaExecution::toDTO)
                .orElseThrow(() -> new HSException("AREA_EXECUTION_NOT_FOUND"));
    }

    @Override
    public void updateAreaExecution(AreaExecutionDTO areaExecutionDTO) {

    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AREA_EXECUTIONS_BY_AREA, key = "#areaId")
    public List<AreaExecutionDTO> getAreaExecutionsByAreaId(Long areaId) {
        return ((List<AreaExecution>) areaExecutionRepository.findByArea_Id(areaId)).stream().map(AreaExecution::toDTO)
                .toList();
    }
}
