package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ActivityService {
    ActivityDTO createActivity(ActivityDTO dto) throws HSException;

    ActivityDTO updateActivity(ActivityDTO dto) throws HSException;

    void deleteActivity(Long id) throws HSException;

    List<ActivityDTO> getAllActivities() throws HSException;

    List<ActivityDTO> getAllActivitiesByYear(int year) throws HSException;

    ActivityDTO getActivityById(Long id) throws HSException;

    List<ActivityDTO> getActivitiesByYearStatusCategory(int year, ActivityStatus status, ActivityCategory category)
            throws HSException;

    void changeActivityStatusProgress(Long id) throws HSException;

    void changeActivityStatusCompleted(Long id) throws HSException;

    void changeActivityStatusRejected(Long id) throws HSException;
}
