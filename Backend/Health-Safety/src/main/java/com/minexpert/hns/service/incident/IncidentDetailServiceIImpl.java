package com.minexpert.hns.service.incident;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentDetailRepository;

@Service
public class IncidentDetailServiceIImpl implements IncidentDetailService {

    public static final String CACHE_INCIDENT_DETAILS_BY_INCIDENT = "incidentDetailsByIncident";
    public static final String CACHE_INCIDENT_DETAIL_SEVERITY_COUNTS = "incidentDetailSeverityCounts";
    public static final String CACHE_INCIDENT_DETAIL_CATEGORY_COUNTS = "incidentDetailCategoryCounts";
    public static final String CACHE_INCIDENT_DETAIL_CATEGORY_SEVERITY_COUNTS = "incidentDetailCategorySeverityCounts";

    @Autowired
    private IncidentDetailRepository incidentDetailRepository;

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_DETAILS_BY_INCIDENT, key = "#incidentId")
    public List<IncidentDetailDTO> getIncidentDetailsByIncidentId(Long incidentId) throws HSException {
        return ((List<IncidentDetail>) incidentDetailRepository.findByIncidentId(incidentId)).stream()
                .map(IncidentDetail::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENT_DETAILS_BY_INCIDENT, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_DETAIL_SEVERITY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_DETAIL_CATEGORY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_DETAIL_CATEGORY_SEVERITY_COUNTS, allEntries = true)
    })
    public void deleteIncidentDetail(Long id) throws HSException {
        incidentDetailRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_DETAIL_SEVERITY_COUNTS)
    public List<CategorySeverityCount> countIncidentDetailsBySeverityLevel() throws HSException {
        return incidentDetailRepository.countIncidentDetailsBySeverityLevel();
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_DETAIL_CATEGORY_COUNTS)
    public List<CategorySeverityCount> countIncidentDetailsByCategory() throws HSException {
        return incidentDetailRepository.countIncidentDetailsByCategory();
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_DETAIL_CATEGORY_SEVERITY_COUNTS)
    public List<CategorySeverityCount> countByCategoryAndSeverityLevel() throws HSException {
        return incidentDetailRepository.countByCategoryAndSeverityLevel();
    }

}
