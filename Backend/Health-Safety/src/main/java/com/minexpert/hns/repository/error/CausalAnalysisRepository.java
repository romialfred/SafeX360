package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.CausalAnalysis;

public interface CausalAnalysisRepository extends CrudRepository<CausalAnalysis, Long> {

    List<CausalAnalysis> findByErrorEventId(Long errorEventId);

    /** Analyses causales rattachees a un incident (module Investigation). */
    List<CausalAnalysis> findByIncidentId(Long incidentId);
}
