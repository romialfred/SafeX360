package com.minexpert.hns.repository.inspections;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import com.minexpert.hns.entity.inspections.InspectionReport;

public interface InspectionReportRepository extends CrudRepository<InspectionReport, Long> {

    public Optional<InspectionReport> findByGeneralInspectionId(Long id);

    public Boolean existsByGeneralInspectionId(Long id); // Added method to check existence by GeneralInspection ID

    /** Cloisonnement par mine : companyId null ne filtre pas. */
    @Query("SELECT r FROM InspectionReport r WHERE r.generalInspection.id = :inspectionId "
            + "AND (:companyId IS NULL OR r.companyId = :companyId)")
    Optional<InspectionReport> findByInspectionAndCompany(@Param("inspectionId") Long inspectionId,
            @Param("companyId") Long companyId);
}
