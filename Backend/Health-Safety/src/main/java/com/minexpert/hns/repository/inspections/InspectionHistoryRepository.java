package com.minexpert.hns.repository.inspections;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.inspections.InspectionHistory;

public interface InspectionHistoryRepository extends CrudRepository<InspectionHistory, Long> {
    List<InspectionHistory> findByInspectionId(Long inspectionId);

    /** Cloisonnement par mine : companyId null ne filtre pas. */
    @Query("SELECT h FROM InspectionHistory h WHERE h.inspection.id = :inspectionId "
            + "AND (:companyId IS NULL OR h.companyId = :companyId)")
    List<InspectionHistory> findByInspectionAndCompany(@Param("inspectionId") Long inspectionId,
            @Param("companyId") Long companyId);
}
