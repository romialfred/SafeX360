package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.audit.AreaExecutionDTO;
import com.minexpert.hns.entity.audit.AreaExecution;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AreaExecutionRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AreaExecutionServiceImpl implements AreaExecutionService {
    private final AreaExecutionRepository areaExecutionRepository;
    private final MediaService mediaService;

    @Override
    public Long createAreaExecution(AreaExecutionDTO areaExecutionDTO) {
        areaExecutionDTO.setCreatedAt(LocalDateTime.now());
        areaExecutionDTO.setUpdatedAt(LocalDateTime.now());
        AreaExecution areaExecution = areaExecutionDTO.toEntity();
        areaExecution.setEvidence(mediaService.saveAllMedia(areaExecutionDTO.getEvidence()));
        return areaExecutionRepository.save(areaExecution).getId();
    }

    @Override
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
    public AreaExecutionDTO getAreaExecution(Long id) throws HSException {
        return areaExecutionRepository.findById(id).map(AreaExecution::toDTO)
                .orElseThrow(() -> new HSException("AREA_EXECUTION_NOT_FOUND"));
    }

    @Override
    public void updateAreaExecution(AreaExecutionDTO areaExecutionDTO) {

    }

    @Override
    public List<AreaExecutionDTO> getAreaExecutionsByAreaId(Long areaId) {
        return ((List<AreaExecution>) areaExecutionRepository.findByArea_Id(areaId)).stream().map(AreaExecution::toDTO)
                .toList();
    }
}
