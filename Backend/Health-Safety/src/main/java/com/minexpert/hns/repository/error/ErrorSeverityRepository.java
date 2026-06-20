package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorSeverity;

public interface ErrorSeverityRepository extends CrudRepository<ErrorSeverity, Long> {

    List<ErrorSeverity> findAllByOrderByLevelAsc();
}
