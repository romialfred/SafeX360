package com.minexpert.hns.repository.inspections;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.inspections.InspectionInterviews;

public interface InspectionInterviewsRepository extends CrudRepository<InspectionInterviews, Long> {

    Optional<InspectionInterviews> findByGeneralInspection_Id(Long id);

    /** Cloisonnement par mine : companyId null ne filtre pas. */
    @Query("SELECT i FROM InspectionInterviews i WHERE i.generalInspection.id = :inspectionId "
            + "AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<InspectionInterviews> findByInspectionAndCompany(@Param("inspectionId") Long inspectionId,
            @Param("companyId") Long companyId);

}
