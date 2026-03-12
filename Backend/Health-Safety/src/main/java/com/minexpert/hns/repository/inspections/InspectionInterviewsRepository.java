package com.minexpert.hns.repository.inspections;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.inspections.InspectionInterviews;

public interface InspectionInterviewsRepository extends CrudRepository<InspectionInterviews, Long> {

    Optional<InspectionInterviews> findByGeneralInspection_Id(Long id);

}
