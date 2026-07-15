package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.inspections.InspectionChecklist;

public interface InspectionChecklistRepository extends CrudRepository<InspectionChecklist, Long> {

    List<InspectionChecklist> findByGeneralInspection_Id(Long id);

    /** Cloisonnement par mine : companyId null ne filtre pas. */
    @Query("SELECT c FROM InspectionChecklist c WHERE c.generalInspection.id = :inspectionId "
            + "AND (:companyId IS NULL OR c.companyId = :companyId)")
    List<InspectionChecklist> findByInspectionAndCompany(@Param("inspectionId") Long inspectionId,
            @Param("companyId") Long companyId);
}
