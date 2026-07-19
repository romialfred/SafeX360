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
            // Clés de cache suffixées par companyId : purge globale sur mutation.
            @CacheEvict(cacheNames = "inspectionReportByInspection", allEntries = true)
    })
    public Long createReport(InspectionReportDTO report) throws HSException {
        // Un rapport d'inspection SANS mine (companyId absent) devient une entite
        // orpheline, invisible des qu'une mine est selectionnee. On refuse la
        // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
        // injecte dans le DTO par le controller depuis la mine active du header.
        if (report.getCompanyId() == null || report.getCompanyId() <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }

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
    @Cacheable(cacheNames = "inspectionReportById", key = "#id + '-' + #companyId")
    public InspectionReportDTO findById(Long id, Long companyId) throws HSException {
        InspectionReport inspectionReport = inspectionReportRepository.findById(id)
                .orElseThrow(() -> new HSException("INSPECTION_REPORT_NOT_FOUND"));
        // Cloisonnement : ne pas divulguer un rapport d'une autre mine.
        if (companyId != null && !companyId.equals(inspectionReport.getCompanyId())) {
            throw new HSException("INSPECTION_REPORT_NOT_FOUND");
        }
        InspectionReportDTO reportDTO = inspectionReport.toDTO();
        if (inspectionReport.getDocs() != null) {
            reportDTO.setDocs(mediaService.getAllMediaByArray(inspectionReport.getDocs()));
        }
        return reportDTO;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "inspectionReportById", allEntries = true),
            @CacheEvict(cacheNames = "inspectionReportByInspection", allEntries = true)
    })
    public void updateReport(InspectionReportDTO report, Long companyId) throws HSException {
        InspectionReport existingReport = inspectionReportRepository.findById(report.getId())
                .orElseThrow(() -> new HSException("INSPECTION_REPORT_NOT_FOUND"));
        // Cloisonnement : ne pas modifier un rapport d'une autre mine.
        if (companyId != null && !companyId.equals(existingReport.getCompanyId())) {
            throw new HSException("INSPECTION_REPORT_NOT_FOUND");
        }

        existingReport.setUpdatedAt(LocalDateTime.now());

        if (report.getDocs() != null) {
            existingReport.setDocs(mediaService.saveAllMedia(report.getDocs()));
        }

        inspectionReportRepository.save(existingReport);
    }

    @Override
    @Cacheable(cacheNames = "inspectionReportByInspection", key = "#id + '-' + #companyId")
    public InspectionReportDTO findByGeneralInspectionId(Long id, Long companyId) throws HSException {
        Optional<InspectionReport> inspectionReportOpt = inspectionReportRepository
                .findByInspectionAndCompany(id, companyId);
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
