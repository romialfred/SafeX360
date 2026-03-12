package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.exception.HSException;

public interface IncidentDetailService {
    public List<IncidentDetailDTO> getIncidentDetailsByIncidentId(Long incidentId) throws HSException;

    public void deleteIncidentDetail(Long id) throws HSException;

    public List<CategorySeverityCount> countIncidentDetailsBySeverityLevel() throws HSException;

    public List<CategorySeverityCount> countIncidentDetailsByCategory() throws HSException;

    public List<CategorySeverityCount> countByCategoryAndSeverityLevel() throws HSException;
}
