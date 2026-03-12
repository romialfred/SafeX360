package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WorkAreaDTO;
import com.minexpert.hns.exception.HSException;

public interface WorkAreaService {
    public Long addWorkArea(WorkAreaDTO workAreaDTO) throws HSException;

    public void updateWorkArea(WorkAreaDTO workAreaDTO) throws HSException;

    public void deleteWorkArea(Long id) throws HSException;

    public WorkAreaDTO getWorkAreaById(Long id) throws HSException;

    public List<WorkAreaDTO> getAllWorkArea() throws HSException;

    public List<WorkAreaDTO> getAllActiveWorkArea() throws HSException;

    public void activateWorkArea(Long id) throws HSException;

    public void deactivateWorkArea(Long id) throws HSException;
}
