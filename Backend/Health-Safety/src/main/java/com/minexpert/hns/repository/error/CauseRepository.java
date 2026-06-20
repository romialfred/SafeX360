package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.Cause;

public interface CauseRepository extends CrudRepository<Cause, Long> {

    List<Cause> findByCausalAnalysisId(Long causalAnalysisId);
}
