package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.exception.HSException;

public interface IncidentTypeService {
    public Long addIncidentType(IncidentTypeDTO incidentTypeDTO) throws HSException;

    public void updateIncidentType(IncidentTypeDTO incidentTypeDTO) throws HSException;

    public void deleteIncidentType(Long id);

    public IncidentTypeDTO getIncidentTypeById(Long id) throws HSException;

    public List<IncidentTypeDetails> getAllIncidentTypes() throws HSException;

    public List<IncidentTypeDetails> getAllActiveIncidentTypes() throws HSException;

    public void activateIncidentType(Long id) throws HSException;

    public void deactivateIncidentType(Long id) throws HSException;

    public List<CategorySeverityCount> countIncidentTypesBySeverityLevel() throws HSException;

    public List<CategorySeverityCount> countIncidentTypesByCategory() throws HSException;

    public List<CategorySeverityCount> countByCategoryAndSeverityLevel() throws HSException;
}
