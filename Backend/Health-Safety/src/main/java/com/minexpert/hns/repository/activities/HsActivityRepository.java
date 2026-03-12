package com.minexpert.hns.repository.activities;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.activities.ActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityResponse;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.enums.ActivityType;

public interface HsActivityRepository extends CrudRepository<HsActivity, Long> {

        @Query("Select a.id as id, a.activity.title AS title, a.activity.id as activityId, a.type AS type,  a.location.name AS location, "
                        + "a.plannedDate AS plannedDate, a.startTime AS startTime, a.endTime AS endTime, a.status AS status FROM HsActivity a")
        List<HsActivityResponse> findAllActivities();

        @Query("Select a.id as id, a.activity.title AS title, a.activity.id as activityId, a.type AS type,  a.location.name AS location, "
                        + "a.plannedDate AS plannedDate, a.startTime AS startTime, a.endTime AS endTime, a.status AS status FROM HsActivity a where a.type = ?1")
        List<HsActivityResponse> findAllMeetings(@Param("type") ActivityType type);

        @Query("Select a.id as id, a.activity.title AS title, a.activity.id as activityId, a.type AS type,  a.location.name AS location, "
                        + "a.plannedDate AS plannedDate, a.startTime AS startTime, a.endTime AS endTime, a.status AS status FROM HsActivity a where a.type = ?1")
        List<HsActivityResponse> findAllTours(@Param("type") ActivityType type);

        @Query("Select a.id as id, a.activity.title AS title, a.activity.id as activityId, a.type AS type,  a.location.name AS location, "
                        + "a.plannedDate AS plannedDate, a.startTime AS startTime, a.endTime AS endTime, a.status AS status FROM HsActivity a where a.id=:id")
        Optional<HsActivityResponse> findActivityInfo(Long id);

        @Query("SELECT new com.minexpert.hns.dto.activities.ActivityDetails(" +
                        "a.id, a.activity.title, a.activity.id, a.type, a.location.name,  a.location.id, " +
                        "a.plannedDate, a.startTime, a.endTime, a.objectives, a.agenda, " +
                        "a.expectedResults, a.ppe, a.participants, a.status) " +
                        "FROM HsActivity a WHERE a.id = :id")
        Optional<ActivityDetails> findActivityDetailsById(@Param("id") Long id);

        Optional<HsActivity> findFirstByTypeAndPlannedDateGreaterThanEqualOrderByPlannedDateAsc(ActivityType type,
                        LocalDate date);
}
