package com.minexpert.hns.service.audit;

import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.dto.audit.ReportDTO;
import com.minexpert.hns.exception.HSException;

public interface ReportService {
    public Long createReport(ExecuteRequest request) throws HSException;

    public void updateReport(ExecuteRequest request) throws HSException;

    public ReportDTO getReport(Long id) throws HSException;

    public ExecuteRequest getReportByAuditId(Long auditId) throws HSException;

    public Boolean reportExists(Long auditId) throws HSException;

}
