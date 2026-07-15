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
    public void createActivity(HsActivityDTO hsActivityDTO, Long companyId) throws HSException {
        // Anti-spoof en ECRITURE : l'activite planning parente (activityId) doit
        // relever de la mine appelante. getActivityById applique la garde
        // d'appartenance (repli "null = global"). Empeche un client d'attacher
        // une HsActivity a l'activite d'une autre mine.
        if (companyId != null) {
            activityService.getActivityById(hsActivityDTO.getActivityId(), companyId);
        }
        hsActivityDTO.setCreatedAt(LocalDateTime.now());
        hsActivityDTO.setUpdatedAt(LocalDateTime.now());
        hsActivityDTO.setStatus(ActivityStatus.PENDING);
        activityService.changeActivityStatusProgress(hsActivityDTO.getActivityId());
        hsActivityRepository.save(hsActivityDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true)
    })
    public void updateActivity(HsActivityDTO hsActivityDTO, Long companyId) throws HSException {
        hsActivityRepository.findById(hsActivityDTO.getId())
                .orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
        verifyCompany(hsActivityDTO.getId(), companyId);
        hsActivityDTO.setUpdatedAt(LocalDateTime.now());
        hsActivityRepository.save(hsActivityDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_HISTORY_BY_ACTIVITY, key = "#id")
    })
    public void deleteActivity(Long id, Long companyId) throws HSException {
        verifyCompany(id, companyId);
        hsActivityRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<HsActivityResponse> getAllActivities(Long companyId) throws HSException {
        return hsActivityRepository.findAllActivities(companyId);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#id + '-' + #companyId")
    public HsActivityResponse getActivityInfo(Long id, Long companyId) throws HSException {
        verifyCompany(id, companyId);
        return hsActivityRepository.findActivityInfo(id).orElseThrow(() -> new HSException("ACTIVITY_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#id + '-' + #companyId")
    public HsActivityDetails getActivityDetails(Long id, Long companyId) throws HSException {
        verifyCompany(id, companyId);
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
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, key = "#companyId != null ? #companyId : 'ALL'")
    public List<HsActivityResponse> getAllMeetings(Long companyId) throws HSException {
        return hsActivityRepository.findAllMeetings(ActivityType.HSM, companyId);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, key = "#companyId != null ? #companyId : 'ALL'")
    public List<HsActivityResponse> getAllTours(Long companyId) throws HSException {
        return hsActivityRepository.findAllTours(ActivityType.ST, companyId);
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

    /**
     * Verifie l'appartenance d'une HsActivity a la mine appelante, via l'activite
     * parente. companyId null = pas de controle. Activite globale (companyId
     * parent null) = accessible a toutes les mines (repli). Non-appartenance :
     * ACTIVITY_NOT_FOUND.
     */
    private void verifyCompany(Long hsActivityId, Long companyId) throws HSException {
        if (companyId == null || hsActivityId == null) {
            return;
        }
        Long parentCompanyId = hsActivityRepository.findParentCompanyId(hsActivityId)
                .orElse(null);
        if (parentCompanyId != null && !companyId.equals(parentCompanyId)) {
            throw new HSException("ACTIVITY_NOT_FOUND");
        }
    }

}
