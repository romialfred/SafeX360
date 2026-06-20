package com.minexpert.hns.repository.error;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorClassification;

public interface ErrorClassificationRepository extends CrudRepository<ErrorClassification, Long> {

    Optional<ErrorClassification> findByErrorEventId(Long errorEventId);
}
