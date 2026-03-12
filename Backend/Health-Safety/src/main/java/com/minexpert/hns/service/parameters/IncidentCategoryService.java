package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.exception.HSException;

public interface IncidentCategoryService {
    public Long addIncidentCategory(IncidentCategoryDTO incidentCategoryDTO) throws HSException;

    public void updateIncidentCategory(IncidentCategoryDTO incidentCategoryDTO) throws HSException;

    public void deleteIncidentCategory(Long id);

    public List<IncidentCategoryDTO> getAllIncidentCategories() throws HSException;

    public List<IncidentCategoryResponse> getAllActiveIncidentCategories() throws HSException;

    public IncidentCategoryDTO getIncidentCategoryById(Long id) throws HSException;

    public void activateIncidentCategory(Long id) throws HSException;

    public void deactivateIncidentCategory(Long id) throws HSException;

}
