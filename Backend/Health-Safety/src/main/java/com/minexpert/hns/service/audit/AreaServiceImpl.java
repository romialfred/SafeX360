package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Long createArea(AreaDTO areaDTO) {
        areaDTO.setCreatedAt(LocalDateTime.now());
        areaDTO.setUpdatedAt(LocalDateTime.now());
        return areaRepository.save(areaDTO.toEntity()).getId();
    }

    @Override
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
    public AreaDTO getAreaById(Long id) {
        Area area = areaRepository.findById(id).orElseThrow(() -> new RuntimeException("AREA_NOT_FOUND"));
        return area.toDTO();
    }

    @Override
    public List<AreaDTO> getAreasByAuditId(Long auditId) {
        return ((List<Area>) areaRepository.findByAudit_Id(auditId)).stream().map(Area::toDTO).toList();
    }

    @Override
    public List<AreaDetails> getAreaDetailsByAuditId(Long auditId) {
        List<AreaDetails> areas = areaRepository.findDetailsByAuditId(auditId);
        return areas;
    }

}
