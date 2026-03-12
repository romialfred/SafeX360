package com.minexpert.hns.repository.inspections;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.entity.GeneralInspection;

public interface GeneralInspectionRepository extends CrudRepository<GeneralInspection, Long> {

        @Query("SELECT gi.id AS id, gi.activity.title AS title, gi.activity.id as activityId, gi.site.id AS siteId, gi.site.name AS siteName,  gi.site.id as locationId, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi ")
        List<GeneralInspectionResponse> findAllInspections();

        @Query("SELECT gi.id AS id,  gi.activity.title AS title, gi.activity.id as activityId,  gi.site.id AS siteId,  gi.site.name as location, "
                        + "gi.plannedDate AS plannedDate, gi.startTime AS startTime, gi.endTime AS endTime, gi.status AS status "
                        + "FROM GeneralInspection gi  where gi.id= ?1")
        Optional<InspectionInfo> findInspectionInfo(Long id);

        Optional<GeneralInspection> findFirstByPlannedDateGreaterThanEqualOrderByPlannedDateAsc(LocalDate date);
}
