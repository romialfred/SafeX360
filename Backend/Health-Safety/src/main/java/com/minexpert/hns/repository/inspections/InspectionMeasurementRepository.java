package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.inspections.InspectionMeasurement;

public interface InspectionMeasurementRepository extends CrudRepository<InspectionMeasurement, Long> {
    List<InspectionMeasurement> findByGeneralInspection_Id(Long id);

    /** Cloisonnement par mine : companyId null ne filtre pas. */
    @Query("SELECT m FROM InspectionMeasurement m WHERE m.generalInspection.id = :inspectionId "
            + "AND (:companyId IS NULL OR m.companyId = :companyId)")
    List<InspectionMeasurement> findByInspectionAndCompany(@Param("inspectionId") Long inspectionId,
            @Param("companyId") Long companyId);
}
