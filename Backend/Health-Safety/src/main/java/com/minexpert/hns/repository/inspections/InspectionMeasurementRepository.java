package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.inspections.InspectionMeasurement;

public interface InspectionMeasurementRepository extends CrudRepository<InspectionMeasurement, Long> {
    List<InspectionMeasurement> findByGeneralInspection_Id(Long id);
}
