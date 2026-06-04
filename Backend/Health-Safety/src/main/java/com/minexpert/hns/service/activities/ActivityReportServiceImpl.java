package com.minexpert.hns.service.activities;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.dto.activities.ActivityReportRequest;
import com.minexpert.hns.entity.activities.ActivityReport;
import com.minexpert.hns.enums.ActivityReportStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.activities.ActivityReportRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.service.incident.CorrectiveActionService;
import com.minexpert.hns.config.ActivityCacheNames;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ActivityReportServiceImpl implements ActivityReportService {

    private final ActivityReportRepository activityReportRepository;
    private final MediaService mediaService;
    private final CorrectiveActionService correctiveActionService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ACTIVITY, key = "#request.report.activityId", condition = "#request.report != null && #request.report.activityId != null"),
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ID, allEntries = true)
    })
    public void addActivityReport(ActivityReportRequest request) throws HSException {
        Long companyId = request.getCompanyId();
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        ActivityReportDTO activityReportDTO = request.getReport();

        Optional<ActivityReport> existingReport = activityReportRepository
                .findByActivity_Id(activityReportDTO.getActivityId());
        if (existingReport.isPresent()) {
            throw new HSException("ACTIVITY_REPORT_ALREADY_EXISTS");
        }

        activityReportDTO.setStatus(ActivityReportStatus.SUBMITTED);
        activityReportDTO.setCreatedAt(LocalDateTime.now());
        activityReportDTO.setUpdatedAt(LocalDateTime.now());
        ActivityReport activityReport = activityReportDTO.toEntity();
        activityReport.setDocs(mediaService.saveAllMedia(activityReportDTO.getDocs()));
        activityReportRepository.save(activityReport);
        if (request.getActions() != null) {
            request.getActions().parallelStream().forEach(action -> {
                try {
                    action.setCompanyId(companyId);
                    correctiveActionService.addCorrectiveAction(companyId, action);
                } catch (HSException e) {
                    e.printStackTrace();
                }
            });
        }

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ID, key = "#result", condition = "#result != null"),
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ACTIVITY, key = "#activityReportDTO.activityId", condition = "#activityReportDTO.activityId != null")
    })
    public Long addActivityReport(ActivityReportDTO activityReportDTO) throws HSException {
        Optional<ActivityReport> existingReport = activityReportRepository
                .findByActivity_Id(activityReportDTO.getActivityId());
        if (existingReport.isPresent()) {
            throw new HSException("ACTIVITY_REPORT_ALREADY_EXISTS");
        }

        activityReportDTO.setStatus(ActivityReportStatus.SUBMITTED);
        activityReportDTO.setCreatedAt(LocalDateTime.now());
        activityReportDTO.setUpdatedAt(LocalDateTime.now());
        ActivityReport activityReport = activityReportDTO.toEntity();
        activityReport.setDocs(mediaService.saveAllMedia(activityReportDTO.getDocs()));
        return activityReportRepository.save(activityReport).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ID, key = "#activityReportDTO.id"),
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ACTIVITY, key = "#activityReportDTO.activityId", condition = "#activityReportDTO.activityId != null")
    })
    public void updateActivityReport(ActivityReportDTO activityReportDTO) throws HSException {
        ActivityReport activityReport = activityReportRepository.findById(activityReportDTO.getId())
                .orElseThrow(() -> new HSException("ACTIVITY_REPORT_NOT_FOUND"));
        activityReport.setSummary(activityReportDTO.getSummary());
        activityReport.setFindings(activityReportDTO.getFindings());
        activityReport.setDocs(mediaService.saveAllMedia(activityReportDTO.getDocs()));
        activityReport.setSignOff(activityReportDTO.getSignOff().toString());
        activityReport.setUpdatedAt(LocalDateTime.now());
        activityReport.setDocs(mediaService.saveAllMedia(activityReportDTO.getDocs()));
        activityReportRepository.save(activityReport);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ACTIVITY, allEntries = true)
    })
    public void deleteActivityReport(Long id) throws HSException {
        if (!activityReportRepository.existsById(id)) {
            throw new HSException("ACTIVITY_REPORT_NOT_FOUND");
        }
        activityReportRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ID, key = "#id")
    public ActivityReportDTO getActivityReportById(Long id) throws HSException {
        ActivityReport activityReport = activityReportRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_REPORT_NOT_FOUND"));
        ActivityReportDTO activityReportDTO = activityReport.toDTO();
        activityReportDTO.setDocs(mediaService.getAllMediaByArray(activityReport.getDocs()));
        return activityReportDTO;
    }

    @Override
    @Cacheable(cacheNames = ActivityCacheNames.ACTIVITY_REPORT_BY_ACTIVITY, key = "#activityId")
    public ActivityReportDTO getActivityReportByActivityId(Long activityId) throws HSException {
        ActivityReport activityReport = activityReportRepository.findByActivity_Id(activityId)
                .orElseThrow(() -> new HSException("ACTIVITY_REPORT_NOT_FOUND"));
        ActivityReportDTO activityReportDTO = activityReport.toDTO();
        activityReportDTO.setDocs(mediaService.getAllMediaByArray(activityReport.getDocs()));
        return activityReportDTO;
    }

}
