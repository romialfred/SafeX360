package com.minexpert.hns.repository.inspections;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.entity.GeneralInspection;

public interface GeneralInspectionRepository extends CrudRepository<GeneralInspection, Long> {

        // Cloisonnement par mine : companyId null (appel système / allMines) ne filtre pas.
        @Query("SELECT gi.id AS id, gi.activity.title AS title, gi.activity.id as activityId, gi.site.id AS siteId, gi.site.name AS siteName,  gi.site.id as locationId, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi WHERE (:companyId IS NULL OR gi.companyId = :companyId)")
        List<GeneralInspectionResponse> findAllInspections(@Param("companyId") Long companyId);

        @Query("SELECT gi.id AS id,  gi.activity.title AS title, gi.activity.id as activityId,  gi.site.id AS siteId,  gi.site.name as location, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi  WHERE gi.id = :id AND (:companyId IS NULL OR gi.companyId = :companyId)")
        Optional<InspectionInfo> findInspectionInfo(@Param("id") Long id, @Param("companyId") Long companyId);

        /** Registre des inspections (entités) filtré par mine. Utilisé par le workflow. */
        @Query("SELECT gi FROM GeneralInspection gi WHERE (:companyId IS NULL OR gi.companyId = :companyId)")
        List<GeneralInspection> findAllByCompany(@Param("companyId") Long companyId);

        Optional<GeneralInspection> findFirstByPlannedDateGreaterThanEqualOrderByPlannedDateAsc(LocalDate date);
}
