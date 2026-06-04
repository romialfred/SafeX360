package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.repository.planning.ActivityRepository;
import lombok.RequiredArgsConstructor;
import com.minexpert.hns.exception.HSException;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.ActivityCacheNames;
import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.planning.ActivityRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {
    private final ActivityRepository activityRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public ActivityDTO createActivity(ActivityDTO dto) throws HSException {
        Activity activity = dto.toEntity();
        activity.setId(null);
        LocalDateTime now = LocalDateTime.now();
        activity.setCreatedAt(now);
        activity.setUpdatedAt(now);
        activity.setStatus(ActivityStatus.PENDING);
        return activityRepository.save(activity).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#dto.id"),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public ActivityDTO updateActivity(ActivityDTO dto) throws HSException {
        Activity activity = activityRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        activity.setTitle(dto.getTitle());
        activity.setMonth(dto.getMonth());
        activity.setDateTime(dto.getDateTime());
        activity.setResponsibleId(dto.getResponsibleId());
        activity.setCategory(dto.getCategory());
        activity.setUpdatedAt(java.time.LocalDateTime.now());
        return activityRepository.save(activity).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public void deleteActivity(Long id) throws HSException {
        if (!activityRepository.existsById(id)) {
            throw new HSException("ACTIVITY_NOT_FOUND");
        }
        activityRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES)
    public List<ActivityDTO> getAllActivities() throws HSException {
        return StreamSupport.stream(activityRepository.findAll().spliterator(), false)
                .map(Activity::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, key = "#year")
    public List<ActivityDTO> getAllActivitiesByYear(int year) throws HSException {
        return StreamSupport.stream(activityRepository.findAll().spliterator(), false)
                .filter(a -> a.getMonth() != null && a.getMonth().getYear() == year)
                .map(Activity::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id")
    public ActivityDTO getActivityById(Long id) throws HSException {
        return activityRepository.findById(id)
                .map(Activity::toDTO)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
    }

    // Conversion methods moved to entity and DTO classes
    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, key = "#year + ':' + #status + ':' + #category")
    public List<ActivityDTO> getActivitiesByYearStatusCategory(int year, ActivityStatus status,
            ActivityCategory category) throws HSException {
        return activityRepository.findByYearAndStatusAndCategory(year, status, category)
                .stream()
                .map(Activity::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public void changeActivityStatusProgress(Long id) throws HSException {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        activity.setStatus(ActivityStatus.IN_PROGRESS);
        activityRepository.save(activity);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public void changeActivityStatusCompleted(Long id) throws HSException {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        activity.setStatus(ActivityStatus.COMPLETED);
        activityRepository.save(activity);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public void changeActivityStatusRejected(Long id) throws HSException {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        activity.setStatus(ActivityStatus.CANCELLED);
        activityRepository.save(activity);
    }
}
