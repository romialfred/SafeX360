package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.minexpert.hns.api.ActionProcessAPI;
import com.minexpert.hns.dto.inspections.InspectionReportDTO;
import com.minexpert.hns.entity.inspections.InspectionReport;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.InspectionReportRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class InspectionReportServiceImpl implements InspectionReportService {

    private final InspectionReportRepository inspectionReportRepository;
    private final MediaService mediaService;

    @Override
    @Caching(evict = {
            // @CacheEvict(cacheNames = "inspectionReportById", allEntries = true),
            @CacheEvict(cacheNames = "inspectionReportByInspection", key = "#report.generalInspectionId", condition = "#report.generalInspectionId != null")
    })
    public Long createReport(InspectionReportDTO report) throws HSException {

        if (inspectionReportRepository.existsByGeneralInspectionId(report.getGeneralInspectionId())) {
            throw new HSException("INSPECTION_REPORT_ALREADY_EXISTS");
        }

        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        InspectionReport inspectionReport = report.toEntity();
        if (report.getDocs() != null) {
            inspectionReport.setDocs(mediaService.saveAllMedia(report.getDocs()));
        }

        inspectionReport = inspectionReportRepository.save(inspectionReport);
        return inspectionReport.getId();
    }

    @Override
    @Cacheable(cacheNames = "inspectionReportById", key = "#id")
    public InspectionReportDTO findById(Long id) throws HSException {
        InspectionReport inspectionReport = inspectionReportRepository.findById(id)
                .orElseThrow(() -> new HSException("INSPECTION_REPORT_NOT_FOUND"));
        InspectionReportDTO reportDTO = inspectionReport.toDTO();
        if (inspectionReport.getDocs() != null) {
            reportDTO.setDocs(mediaService.getAllMediaByArray(inspectionReport.getDocs()));
        }
        return reportDTO;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionReportById", key = "#report.id"),
            @CacheEvict(cacheNames = "inspectionReportByInspection", allEntries = true)
    })
    public void updateReport(InspectionReportDTO report) throws HSException {
        InspectionReport existingReport = inspectionReportRepository.findById(report.getId())
                .orElseThrow(() -> new HSException("INSPECTION_REPORT_NOT_FOUND"));

        existingReport.setUpdatedAt(LocalDateTime.now());

        if (report.getDocs() != null) {
            existingReport.setDocs(mediaService.saveAllMedia(report.getDocs()));
        }

        inspectionReportRepository.save(existingReport);
    }

    @Override
    @Cacheable(cacheNames = "inspectionReportByInspection", key = "#id")
    public InspectionReportDTO findByGeneralInspectionId(Long id) throws HSException {
        Optional<InspectionReport> inspectionReportOpt = inspectionReportRepository.findByGeneralInspectionId(id);
        if (inspectionReportOpt.isEmpty()) {
            throw new HSException("INSPECTION_REPORT_NOT_FOUND");
        }
        InspectionReport inspectionReport = inspectionReportOpt.get();
        InspectionReportDTO reportDTO = inspectionReport.toDTO();
        if (inspectionReport.getDocs() != null) {
            reportDTO.setDocs(mediaService.getAllMediaByArray(inspectionReport.getDocs()));
        }
        return reportDTO;
    }

}
