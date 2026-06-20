package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorProbability;

public interface ErrorProbabilityRepository extends CrudRepository<ErrorProbability, Long> {

    List<ErrorProbability> findAllByOrderByLevelAsc();
}
