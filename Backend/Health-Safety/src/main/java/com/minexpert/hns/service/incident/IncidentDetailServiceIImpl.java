package com.minexpert.hns.service.incident;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.IncidentDetailDTO;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentDetailRepository;

@Service
public class IncidentDetailServiceIImpl implements IncidentDetailService {

    public static final String CACHE_INCIDENT_DETAILS_BY_INCIDENT = "incidentDetailsByIncident";

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
    @CacheEvict(cacheNames = CACHE_INCIDENT_DETAILS_BY_INCIDENT, allEntries = true)
    public void deleteIncidentDetail(Long id) throws HSException {
        incidentDetailRepository.deleteById(id);
    }

    // SUPPRIMÉ avec les trois agrégations non cloisonnées, ainsi que leurs caches
    // (incidentDetailSeverityCounts / CategoryCounts / CategorySeverityCounts).
    //
    // Ces caches AGGRAVAIENT la fuite : déclarés sans `key`, ils ne comportaient
    // qu'une seule entrée partagée. La première réponse calculée était donc
    // resservie telle quelle à toutes les entreprises suivantes — même si les
    // requêtes avaient été cloisonnées, le cache aurait continué de mélanger
    // les mines. Les équivalents corrects sont dans IncidentTypeService.
}
