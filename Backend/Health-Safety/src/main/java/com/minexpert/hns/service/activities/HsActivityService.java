package com.minexpert.hns.service.activities;

import java.util.List;

import com.minexpert.hns.dto.activities.HsActivityDTO;
import com.minexpert.hns.dto.activities.HsActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityResponse;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.exception.HSException;

public interface HsActivityService {

    public void createActivity(HsActivityDTO hsActivityDTO) throws HSException;

    public void updateActivity(HsActivityDTO hsActivityDTO) throws HSException;

    public void deleteActivity(Long id) throws HSException;

    public List<HsActivityResponse> getAllActivities() throws HSException;

    public HsActivityResponse getActivityInfo(Long id) throws HSException;

    public HsActivityDetails getActivityDetails(Long id) throws HSException;

    public List<HsActivityResponse> getAllMeetings() throws HSException;

    public List<HsActivityResponse> getAllTours() throws HSException;

    public void updateActivityStatus(Long activityId, ActivityStatus status) throws HSException;
}
