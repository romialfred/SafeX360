package com.minexpert.hns.repository.error;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.JustCultureAssessment;

public interface JustCultureAssessmentRepository extends CrudRepository<JustCultureAssessment, Long> {

    Optional<JustCultureAssessment> findByErrorEventId(Long errorEventId);
}
