package com.minexpert.hns.repository.nonConformity;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.nonConformity.EventAnalysis;

public interface EventAnalysisRepository extends CrudRepository<EventAnalysis, Long> {
    Boolean existsByNonConformityId(Long nonConformityId);

    Optional<EventAnalysis> findByNonConformityId(Long nonConformityId);

}
