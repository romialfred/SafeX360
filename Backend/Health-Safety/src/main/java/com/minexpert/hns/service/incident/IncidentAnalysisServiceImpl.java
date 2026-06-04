package com.minexpert.hns.service.incident;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentAnalysisRepository;

@Service
@Transactional
public class IncidentAnalysisServiceImpl implements IncidentAnalysisService {

    @Autowired
    private IncidentAnalysisRepository incidentAnalysisRepository;

    @Override
    public IncidentDTO getIncidentAnalysisByIncidentId(Long incidentId) throws HSException {
        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(incidentId);
        return null;
    }

}
