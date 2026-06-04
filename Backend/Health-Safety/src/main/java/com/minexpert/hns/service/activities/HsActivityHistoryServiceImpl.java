package com.minexpert.hns.service.activities;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.HsActivityHistoryDTO;
import com.minexpert.hns.entity.activities.HsActivityHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.activities.HsActivityHistoryRepository;
import com.minexpert.hns.config.ActivityCacheNames;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class HsActivityHistoryServiceImpl implements HsActivityHistoryService {

    private final HsActivityHistoryRepository hsActivityHistoryRepository;
    private final HsActivityService activityService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_HISTORY_BY_ACTIVITY, key = "#hsActivityHistoryDTO.hsActivityId"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_DETAILS, key = "#hsActivityHistoryDTO.hsActivityId"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_INFO, key = "#hsActivityHistoryDTO.hsActivityId"),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITIES_ALL, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_MEETINGS, allEntries = true),
            @CacheEvict(cacheNames = ActivityCacheNames.HS_ACTIVITY_TOURS, allEntries = true)
    })
    public Long saveHsActivityHistory(HsActivityHistoryDTO hsActivityHistoryDTO) throws HSException {
        hsActivityHistoryDTO.setCreatedAt(LocalDateTime.now());
        activityService.updateActivityStatus(hsActivityHistoryDTO.getHsActivityId(), hsActivityHistoryDTO.getStatus());
        return hsActivityHistoryRepository.save(hsActivityHistoryDTO.toEntity()).getId();
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.HS_ACTIVITY_HISTORY_BY_ACTIVITY, key = "#hsActivityId")
    public List<HsActivityHistoryDTO> getHsActivityHistoryByHsActivityId(Long hsActivityId) throws HSException {
        List<HsActivityHistory> histories = hsActivityHistoryRepository.findByHsActivityId(hsActivityId);
        return histories.stream().map(h -> new HsActivityHistoryDTO(
                h.getId(),
                h.getOwnerId(),
                h.getDate(),
                h.getStatus(),
                h.getComment(),
                h.getHsActivity() != null ? h.getHsActivity().getId() : null,
                h.getCreatedAt())).collect(Collectors.toList());
    }
}
