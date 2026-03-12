package com.minexpert.hns.service.activities;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.dto.activities.ActivityReportRequest;
import com.minexpert.hns.entity.activities.ActivityReport;
import com.minexpert.hns.enums.ActivityReportStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.activities.ActivityReportRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.service.incident.CorrectiveActionService;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityReportServiceImpl implements ActivityReportService {

    private final ActivityReportRepository activityReportRepository;
    private final MediaService mediaService;
    private final CorrectiveActionService correctiveActionService;

    @Override
    public void addActivityReport(ActivityReportRequest request) throws HSException {
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
        request.getActions().parallelStream().forEach(action -> {
            try {
                correctiveActionService.addCorrectiveAction(action);
            } catch (HSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        });

    }

    @Override
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
    public void deleteActivityReport(Long id) throws HSException {
        activityReportRepository.deleteById(id);
    }

    @Override
    public ActivityReportDTO getActivityReportById(Long id) throws HSException {
        ActivityReport activityReport = activityReportRepository.findById(id)
                .orElseThrow(() -> new HSException("ACTIVITY_REPORT_NOT_FOUND"));
        ActivityReportDTO activityReportDTO = activityReport.toDTO();
        activityReportDTO.setDocs(mediaService.getAllMediaByArray(activityReport.getDocs()));
        return activityReportDTO;
    }

    @Override
    public ActivityReportDTO getActivityReportByActivityId(Long activityId) throws HSException {
        ActivityReport activityReport = activityReportRepository.findByActivity_Id(activityId)
                .orElseThrow(() -> new HSException("ACTIVITY_REPORT_NOT_FOUND"));
        ActivityReportDTO activityReportDTO = activityReport.toDTO();
        activityReportDTO.setDocs(mediaService.getAllMediaByArray(activityReport.getDocs()));
        return activityReportDTO;
    }

}
