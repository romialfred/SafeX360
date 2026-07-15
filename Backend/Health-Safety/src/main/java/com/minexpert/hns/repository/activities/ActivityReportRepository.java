package com.minexpert.hns.repository.activities;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.activities.ActivityReport;

public interface ActivityReportRepository extends CrudRepository<ActivityReport, Long> {

    Optional<ActivityReport> findByActivity_Id(Long activityId);

    // Cloisonnement : companyId de l'activite planning grand-parente
    // (ActivityReport -> HsActivity -> Activity). null = activite globale.
    @Query("SELECT r.activity.activity.companyId FROM ActivityReport r WHERE r.id = :id")
    Optional<Long> findParentCompanyIdById(@Param("id") Long id);

    @Query("SELECT r.activity.activity.companyId FROM ActivityReport r WHERE r.activity.id = :activityId")
    Optional<Long> findParentCompanyIdByActivityId(@Param("activityId") Long activityId);

}
