package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.audit.ContributorDTO;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.dto.audit.ReportDTO;
import com.minexpert.hns.entity.audit.Contributor;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.enums.AuditReportStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.ReportRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final ReportRepository reportRepository;
    private final MediaService mediaService;
    private final ContributorService contributorService;

    @Override
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
    public void updateReport(ExecuteRequest request) throws HSException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateReport'");
    }

    @Override
    public ReportDTO getReport(Long id) throws HSException {
        return reportRepository.findById(id).map(Report::toDTO).orElseThrow(() -> new HSException("REPORT_NOT_FOUND"));
    }

    @Override
    public ExecuteRequest getReportByAuditId(Long auditId) throws HSException {
        Report report = reportRepository.findByAudit_Id(auditId)
                .orElseThrow(() -> new HSException("REPORT_NOT_FOUND"));
        ReportDTO reportDTO = report.toDTO();
        reportDTO.setDocs(mediaService.getAllMediaByArray(report.getDocs()));
        List<ContributorDTO> contributors = contributorService.getContributorByAuditId(auditId);
        return new ExecuteRequest(reportDTO, contributors);
    }

    @Override
    public Boolean reportExists(Long auditId) throws HSException {
        return reportRepository.existsByAudit_Id(auditId);
    }

}
