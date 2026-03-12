package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.exception.HSException;

public interface WorkProcessService {
    public Long addWorkProcess(WorkProcessDTO workProcessDTO) throws HSException;

    public void updateWorkProcess(WorkProcessDTO workProcessDTO) throws HSException;

    public void deleteWorkProcess(Long id) throws HSException;

    public WorkProcessDTO getWorkProcessById(Long id) throws HSException;

    public List<WorkProcessDTO> getAllWorkProcess() throws HSException;

    public List<WorkProcessDTO> getAllActiveWorkProcess() throws HSException;

    public void activateWorkProcess(Long id) throws HSException;

    public void deactivateWorkProcess(Long id) throws HSException;
}
