package com.minexpert.hns.service.activities;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.config.ActivityCacheNames;
import com.minexpert.hns.dto.activities.ActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityDTO;
import com.minexpert.hns.dto.activities.HsActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityResponse;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.enums.ActivityType;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.activities.HsActivityRepository;
import com.minexpert.hns.service.planning.ActivityService;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class HsActivityServiceImpl implements HsActivityService {

    private final HsActivityRepository hsActivityRepository;
    private final HrmsClient hrmsClient;
    private final ActivityService activityService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true)
    })
    public void createActivity(HsActivityDTO hsActivityDTO) throws HSException {
        hsActivityDTO.setCreatedAt(LocalDateTime.now());
        hsActivityDTO.setUpdatedAt(LocalDateTime.now());
        hsActivityDTO.setStatus(ActivityStatus.PENDING);
        activityService.changeActivityStatusProgress(hsActivityDTO.getActivityId());
        hsActivityRepository.save(hsActivityDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#hsActivityDTO.id"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#hsActivityDTO.id"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true)
    })
    public void updateActivity(HsActivityDTO hsActivityDTO) throws HSException {
        hsActivityRepository.findById(hsActivityDTO.getId())
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        hsActivityDTO.setUpdatedAt(LocalDateTime.now());
        hsActivityRepository.save(hsActivityDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_HISTORY_BY_ACTIVITY, key = "#id")
    })
    public void deleteActivity(Long id) throws HSException {
        hsActivityRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL)
    public List<HsActivityResponse> getAllActivities() throws HSException {
        return hsActivityRepository.findAllActivities();
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#id")
    public HsActivityResponse getActivityInfo(Long id) throws HSException {
        return hsActivityRepository.findActivityInfo(id).orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#id")
    public HsActivityDetails getActivityDetails(Long id) throws HSException {
        ActivityDetails activity = hsActivityRepository.findActivityDetailsById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        HsActivityDetails activityDetails = activity.toDetails();
        List<ParticipantResponse> participants = activity.getParticipants() != null
                ? StringListConverter.convertStringToParticipants(activity.getParticipants())
                : Arrays.asList();
        List<Long> empIds = participants.stream().map(x -> x.getId())
                .filter(x -> x != null)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, EmployeeNameDTO> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, dto -> dto));
        participants.forEach(participant -> {
            if (participant.getId() != null) {
                participant.setName(empIdToDtoMap.get(participant.getId()).getName());
                participant.setEmpNumber(empIdToDtoMap.get(participant.getId()).getEmpNumber());
            }
        });
        activityDetails.setParticipants(participants);
        return activityDetails;
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS)
    public List<HsActivityResponse> getAllMeetings() throws HSException {
        return hsActivityRepository.findAllMeetings(ActivityType.HSM);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS)
    public List<HsActivityResponse> getAllTours() throws HSException {
        return hsActivityRepository.findAllTours(ActivityType.ST);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#activityId"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#activityId"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true)
    })
    public void updateActivityStatus(Long activityId, ActivityStatus status) throws HSException {
        HsActivity activity = hsActivityRepository.findById(activityId)
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        activity.setStatus(status);
        hsActivityRepository.save(activity);
    }

}
