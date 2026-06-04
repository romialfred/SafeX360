package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.AreaDTO;
import com.minexpert.hns.dto.audit.AreaDetails;
import com.minexpert.hns.entity.audit.Area;
import com.minexpert.hns.repository.audit.AreaRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AreaServiceImpl implements AreaService {

    private final AreaRepository areaRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AREAS_BY_AUDIT, key = "#areaDTO.auditId", condition = "#areaDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_DETAILS_BY_AUDIT, key = "#areaDTO.auditId", condition = "#areaDTO.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_BY_ID, key = "#result", condition = "#result != null")
    })
    public Long createArea(AreaDTO areaDTO) {
        areaDTO.setCreatedAt(LocalDateTime.now());
        areaDTO.setUpdatedAt(LocalDateTime.now());
        return areaRepository.save(areaDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.AREAS_BY_AUDIT, key = "#auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_DETAILS_BY_AUDIT, key = "#auditId"),
            @CacheEvict(cacheNames = AuditCacheNames.AREA_BY_ID, allEntries = true)
    })
    public List<Long> createAreas(List<AreaDTO> areaDTOs, Long auditId) {
        areaDTOs.forEach(areaDTO -> {
            areaDTO.setCreatedAt(LocalDateTime.now());
            areaDTO.setUpdatedAt(LocalDateTime.now());
            areaDTO.setAuditId(auditId);
        });
        return ((List<Area>) areaRepository.saveAll(areaDTOs.stream().map(AreaDTO::toEntity).toList())).stream()
                .map(Area::getId)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AREA_BY_ID, key = "#id")
    public AreaDTO getAreaById(Long id) {
        Area area = areaRepository.findById(id).orElseThrow(() -> new RuntimeException("AREA_NOT_FOUND"));
        return area.toDTO();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AREAS_BY_AUDIT, key = "#auditId")
    public List<AreaDTO> getAreasByAuditId(Long auditId) {
        return ((List<Area>) areaRepository.findByAudit_Id(auditId)).stream().map(Area::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.AREA_DETAILS_BY_AUDIT, key = "#auditId")
    public List<AreaDetails> getAreaDetailsByAuditId(Long auditId) {
        List<AreaDetails> areas = areaRepository.findDetailsByAuditId(auditId);
        return areas;
    }

}
