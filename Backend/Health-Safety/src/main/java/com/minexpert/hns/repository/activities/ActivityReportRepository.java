package com.minexpert.hns.repository.activities;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.activities.ActivityReport;

public interface ActivityReportRepository extends CrudRepository<ActivityReport, Long> {

    Optional<ActivityReport> findByActivity_Id(Long activityId);

}
