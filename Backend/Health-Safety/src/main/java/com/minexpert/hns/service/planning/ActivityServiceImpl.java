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
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public ActivityDTO updateActivity(ActivityDTO dto, Long companyId) throws HSException {
        Activity activity = activityRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        verifyCompany(activity, companyId);
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
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED, allEntries = true)
    })
    public void deleteActivity(Long id, Long companyId) throws HSException {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        verifyCompany(activity, companyId);
        activityRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES, key = "#companyId != null ? #companyId : 'ALL'")
    public List<ActivityDTO> getAllActivities(Long companyId) throws HSException {
        return activityRepository.findAllByCompany(companyId)
                .stream()
                .map(Activity::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_BY_YEAR,
            key = "#year + '-' + #companyId")
    public List<ActivityDTO> getAllActivitiesByYear(int year, Long companyId) throws HSException {
        return activityRepository.findAllByCompany(companyId).stream()
                .filter(a -> a.getMonth() != null && a.getMonth().getYear() == year)
                .map(Activity::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITY_BY_ID, key = "#id + '-' + #companyId")
    public ActivityDTO getActivityById(Long id, Long companyId) throws HSException {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        verifyCompany(activity, companyId);
        return activity.toDTO();
    }

    // Conversion methods moved to entity and DTO classes
    @Override
    @Cacheable(cacheNames = ActivityCacheNames.PLANNED_ACTIVITIES_FILTERED,
            key = "#year + ':' + #status + ':' + #category + ':' + #companyId")
    public List<ActivityDTO> getActivitiesByYearStatusCategory(int year, ActivityStatus status,
            ActivityCategory category, Long companyId) throws HSException {
        return activityRepository
                .findByYearAndStatusAndCategoryAndCompany(year, status, category, companyId)
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

    /**
     * Verifie l'appartenance d'une activite a la mine appelante. companyId null
     * (systeme/allMines) = pas de controle. Les activites GLOBALES (companyId
     * null) restent editables/consultables par toutes les mines (repli
     * retrocompat). Non-appartenance : ACTIVITY_NOT_FOUND.
     */
    private void verifyCompany(Activity activity, Long companyId) throws HSException {
        if (companyId == null || activity == null || activity.getCompanyId() == null) {
            return;
        }
        if (!companyId.equals(activity.getCompanyId())) {
            throw new HSException("ACTIVITY_NOT_FOUND");
        }
    }
}
