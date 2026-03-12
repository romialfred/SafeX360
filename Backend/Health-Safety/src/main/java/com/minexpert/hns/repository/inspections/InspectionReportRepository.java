package com.minexpert.hns.repository.inspections;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import com.minexpert.hns.entity.inspections.InspectionReport;

public interface InspectionReportRepository extends CrudRepository<InspectionReport, Long> {

    public Optional<InspectionReport> findByGeneralInspectionId(Long id);

    public Boolean existsByGeneralInspectionId(Long id); // Added method to check existence by GeneralInspection ID
}
