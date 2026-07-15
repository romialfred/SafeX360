package com.minexpert.hns.service.activities;

import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.dto.activities.ActivityReportRequest;
import com.minexpert.hns.exception.HSException;

/**
 * Service des comptes-rendus d'activite HSE, cloisonne par mine via l'activite
 * planning grand-parente (ActivityReport -> HsActivity -> Activity.companyId),
 * repli "null = global". companyId null en parametre = pas de cloisonnement.
 */
public interface ActivityReportService {
    public void addActivityReport(ActivityReportRequest request) throws HSException;

    public Long addActivityReport(ActivityReportDTO activityReportDTO) throws HSException;

    public void updateActivityReport(ActivityReportDTO activityReportDTO, Long companyId)
            throws HSException;

    public void deleteActivityReport(Long id, Long companyId) throws HSException;

    public ActivityReportDTO getActivityReportById(Long id, Long companyId) throws HSException;

    public ActivityReportDTO getActivityReportByActivityId(Long activityId, Long companyId)
            throws HSException;
}
