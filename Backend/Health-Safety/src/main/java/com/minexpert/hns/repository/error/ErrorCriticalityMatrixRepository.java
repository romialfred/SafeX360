package com.minexpert.hns.repository.error;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;

public interface ErrorCriticalityMatrixRepository extends CrudRepository<ErrorCriticalityMatrix, Long> {

    Optional<ErrorCriticalityMatrix> findBySeverityLevelAndProbabilityLevel(Integer severityLevel,
            Integer probabilityLevel);
}
