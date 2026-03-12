package com.minexpert.hns.repository.incident;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.incident.IncidentAnalysis;

public interface IncidentAnalysisRepository extends CrudRepository<IncidentAnalysis, Long> {
    @Query("SELECT ia FROM IncidentAnalysis ia WHERE ia.incident.id = :incidentId")
    Optional<IncidentAnalysis> findByIncidentId(@Param("incidentId") Long incidentId);
}
