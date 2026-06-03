package com.minexpert.hns.service.incident;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentAnalysisRepository;

@Service
public class IncidentAnalysisServiceImpl implements IncidentAnalysisService {

    public static final String CACHE_INCIDENT_ANALYSIS_BY_INCIDENT = "incidentAnalysisByIncident";

    @Autowired
    private IncidentAnalysisRepository incidentAnalysisRepository;

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_ANALYSIS_BY_INCIDENT, key = "#incidentId")
    public IncidentDTO getIncidentAnalysisByIncidentId(Long incidentId) throws HSException {
        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(incidentId);
        return null;
    }

}
