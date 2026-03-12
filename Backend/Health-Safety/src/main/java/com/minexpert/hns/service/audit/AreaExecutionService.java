package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.AreaExecutionDTO;
import com.minexpert.hns.exception.HSException;

public interface AreaExecutionService {
    public Long createAreaExecution(AreaExecutionDTO areaExecutionDTO) throws HSException;

    public List<Long> createAreaExecutionList(List<AreaExecutionDTO> areaExecutionDTOs) throws HSException;

    public AreaExecutionDTO getAreaExecution(Long id) throws HSException;

    public void updateAreaExecution(AreaExecutionDTO areaExecutionDTO) throws HSException;

    public List<AreaExecutionDTO> getAreaExecutionsByAreaId(Long areaId) throws HSException;
}
