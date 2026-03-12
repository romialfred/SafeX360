package com.minexpert.hns.service.activities;

import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.dto.activities.ActivityReportRequest;
import com.minexpert.hns.exception.HSException;

public interface ActivityReportService {
    public void addActivityReport(ActivityReportRequest request) throws HSException;

    public Long addActivityReport(ActivityReportDTO activityReportDTO) throws HSException;

    public void updateActivityReport(ActivityReportDTO activityReportDTO) throws HSException;

    public void deleteActivityReport(Long id) throws HSException;

    public ActivityReportDTO getActivityReportById(Long id) throws HSException;

    public ActivityReportDTO getActivityReportByActivityId(Long activityId) throws HSException;
}
