package com.minexpert.hns.service.incident;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.exception.HSException;

public interface IncidentAnalysisService {
    public IncidentDTO getIncidentAnalysisByIncidentId(Long incidentId) throws HSException;
}
