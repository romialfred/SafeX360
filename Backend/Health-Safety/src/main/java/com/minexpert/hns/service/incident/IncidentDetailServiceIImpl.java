package com.minexpert.hns.service.incident;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentDetailRepository;

@Service
public class IncidentDetailServiceIImpl implements IncidentDetailService {

    @Autowired
    private IncidentDetailRepository incidentDetailRepository;

    @Override
    public List<IncidentDetailDTO> getIncidentDetailsByIncidentId(Long incidentId) throws HSException {
        return ((List<IncidentDetail>) incidentDetailRepository.findByIncidentId(incidentId)).stream()
                .map(IncidentDetail::toDTO)
                .toList();
    }

    @Override
    public void deleteIncidentDetail(Long id) throws HSException {
        incidentDetailRepository.deleteById(id);
    }

    @Override
    public List<CategorySeverityCount> countIncidentDetailsBySeverityLevel() throws HSException {
        return incidentDetailRepository.countIncidentDetailsBySeverityLevel();
    }

    @Override
    public List<CategorySeverityCount> countIncidentDetailsByCategory() throws HSException {
        return incidentDetailRepository.countIncidentDetailsByCategory();
    }

    @Override
    public List<CategorySeverityCount> countByCategoryAndSeverityLevel() throws HSException {
        return incidentDetailRepository.countByCategoryAndSeverityLevel();
    }

}
