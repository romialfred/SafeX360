package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.exception.HSException;

public interface IncidentTypeService {
    Long addIncidentType(Long companyId, IncidentTypeDTO incidentTypeDTO) throws HSException;

    void updateIncidentType(Long companyId, IncidentTypeDTO incidentTypeDTO) throws HSException;

    void deleteIncidentType(Long companyId, Long id) throws HSException;

    IncidentTypeDTO getIncidentTypeById(Long companyId, Long id) throws HSException;

    List<IncidentTypeDetails> getAllIncidentTypes(Long companyId) throws HSException;

    List<IncidentTypeDetails> getAllActiveIncidentTypes(Long companyId) throws HSException;

    void activateIncidentType(Long companyId, Long id) throws HSException;

    void deactivateIncidentType(Long companyId, Long id) throws HSException;

    List<CategorySeverityCount> countIncidentTypesBySeverityLevel(Long companyId) throws HSException;

    List<CategorySeverityCount> countIncidentTypesByCategory(Long companyId) throws HSException;

    List<CategorySeverityCount> countByCategoryAndSeverityLevel(Long companyId) throws HSException;
}
