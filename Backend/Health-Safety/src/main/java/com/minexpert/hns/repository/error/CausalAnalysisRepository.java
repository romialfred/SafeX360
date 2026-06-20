package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.CausalAnalysis;

public interface CausalAnalysisRepository extends CrudRepository<CausalAnalysis, Long> {

    List<CausalAnalysis> findByErrorEventId(Long errorEventId);
}
