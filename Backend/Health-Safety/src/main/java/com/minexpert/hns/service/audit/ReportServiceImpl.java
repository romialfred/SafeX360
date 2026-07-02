package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.AuditCacheNames;
import com.minexpert.hns.dto.audit.ContributorDTO;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.dto.audit.ReportDTO;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.enums.AuditReportStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.ReportRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final ReportRepository reportRepository;
    private final MediaService mediaService;
    private final ContributorService contributorService;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_BY_ID, key = "#result", condition = "#result != null"),
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_BY_AUDIT, key = "#request.report.auditId", condition = "#request.report != null && #request.report.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_EXISTS_BY_AUDIT, key = "#request.report.auditId", condition = "#request.report != null && #request.report.auditId != null")
    })
    public Long createReport(ExecuteRequest request) throws HSException {
        ReportDTO reportDTO = request.getReport();
        reportDTO.setCreatedAt(LocalDateTime.now());
        reportDTO.setUpdatedAt(LocalDateTime.now());
        reportDTO.setStatus(AuditReportStatus.DRAFT);
        Report report = reportDTO.toEntity();
        report.setDocs(mediaService.saveAllMedia(reportDTO.getDocs()));
        contributorService.createContributors(request.getContributors());
        return reportRepository.save(report).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_BY_AUDIT, key = "#request.report.auditId", condition = "#request.report != null && #request.report.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_EXISTS_BY_AUDIT, key = "#request.report.auditId", condition = "#request.report != null && #request.report.auditId != null"),
            @CacheEvict(cacheNames = AuditCacheNames.REPORT_BY_ID, allEntries = true)
    })
    public void updateReport(ExecuteRequest request) throws HSException {
        ReportDTO reportDTO = request.getReport();
        Report existing = reportRepository.findById(reportDTO.getId())
                .orElseThrow(() -> new HSException("REPORT_NOT_FOUND"));
        if (reportDTO.getStatus() != null && reportDTO.getStatus() != existing.getStatus()) {
            assertReportTransition(existing.getStatus(), reportDTO.getStatus());
        }
        reportDTO.setUpdatedAt(LocalDateTime.now());
        Report updated = reportDTO.toEntity();
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        updated.setDocs(mediaService.saveAllMedia(reportDTO.getDocs()));
        if (request.getContributors() != null) {
            contributorService.createContributors(request.getContributors());
        }
        reportRepository.save(updated);
    }

    private static final Map<AuditReportStatus, Set<AuditReportStatus>> REPORT_TRANSITIONS = Map.of(
            AuditReportStatus.DRAFT, Set.of(AuditReportStatus.SUBMITTED),
            AuditReportStatus.SUBMITTED, Set.of(AuditReportStatus.APPROVED, AuditReportStatus.REJECTED),
            AuditReportStatus.APPROVED, Set.of(),
            AuditReportStatus.REJECTED, Set.of(AuditReportStatus.DRAFT)
    );

    private void assertReportTransition(AuditReportStatus current, AuditReportStatus target) throws HSException {
        if (!REPORT_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.REPORT_BY_ID, key = "#id")
    public ReportDTO getReport(Long id) throws HSException {
        return reportRepository.findById(id).map(Report::toDTO).orElseThrow(() -> new HSException("REPORT_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.REPORT_BY_AUDIT, key = "#auditId")
    public ExecuteRequest getReportByAuditId(Long auditId) throws HSException {
        Report report = reportRepository.findByAudit_Id(auditId)
                .orElseThrow(() -> new HSException("REPORT_NOT_FOUND"));
        ReportDTO reportDTO = report.toDTO();
        reportDTO.setDocs(mediaService.getAllMediaByArray(report.getDocs()));
        List<ContributorDTO> contributors = contributorService.getContributorByAuditId(auditId);
        return new ExecuteRequest(reportDTO, contributors);
    }

    @Override
    @Cacheable(cacheNames = AuditCacheNames.REPORT_EXISTS_BY_AUDIT, key = "#auditId")
    public Boolean reportExists(Long auditId) throws HSException {
        return reportRepository.existsByAudit_Id(auditId);
    }

}
