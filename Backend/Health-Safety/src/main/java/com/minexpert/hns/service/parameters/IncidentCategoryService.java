package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.exception.HSException;

public interface IncidentCategoryService {
    public Long addIncidentCategory(Long companyId, IncidentCategoryDTO incidentCategoryDTO) throws HSException;

    public void updateIncidentCategory(Long companyId, IncidentCategoryDTO incidentCategoryDTO) throws HSException;

    public void deleteIncidentCategory(Long companyId, Long id) throws HSException;

    public List<IncidentCategoryDTO> getAllIncidentCategories(Long companyId) throws HSException;

    public List<IncidentCategoryResponse> getAllActiveIncidentCategories(Long companyId) throws HSException;

    public IncidentCategoryDTO getIncidentCategoryById(Long companyId, Long id) throws HSException;

    public void activateIncidentCategory(Long companyId, Long id) throws HSException;

    public void deactivateIncidentCategory(Long companyId, Long id) throws HSException;

}
