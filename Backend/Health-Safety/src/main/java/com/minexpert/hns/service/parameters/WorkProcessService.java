package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.exception.HSException;

public interface WorkProcessService {
    public Long addWorkProcess(Long companyId, WorkProcessDTO workProcessDTO) throws HSException;

    public void updateWorkProcess(Long companyId, WorkProcessDTO workProcessDTO) throws HSException;

    public void deleteWorkProcess(Long companyId, Long id) throws HSException;

    public WorkProcessDTO getWorkProcessById(Long companyId, Long id) throws HSException;

    public List<WorkProcessDTO> getAllWorkProcess(Long companyId) throws HSException;

    public List<WorkProcessDTO> getAllActiveWorkProcess(Long companyId) throws HSException;

    public void activateWorkProcess(Long companyId, Long id) throws HSException;

    public void deactivateWorkProcess(Long companyId, Long id) throws HSException;
}
