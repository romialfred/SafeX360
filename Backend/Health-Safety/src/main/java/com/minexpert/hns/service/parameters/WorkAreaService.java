package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WorkAreaDTO;
import com.minexpert.hns.exception.HSException;

public interface WorkAreaService {
    public Long addWorkArea(Long companyId, WorkAreaDTO workAreaDTO) throws HSException;

    public void updateWorkArea(Long companyId, WorkAreaDTO workAreaDTO) throws HSException;

    public void deleteWorkArea(Long companyId, Long id) throws HSException;

    public WorkAreaDTO getWorkAreaById(Long companyId, Long id) throws HSException;

    public List<WorkAreaDTO> getAllWorkArea(Long companyId) throws HSException;

    public List<WorkAreaDTO> getAllActiveWorkArea(Long companyId) throws HSException;

    public void activateWorkArea(Long companyId, Long id) throws HSException;

    public void deactivateWorkArea(Long companyId, Long id) throws HSException;
}
