
package com.minexpert.hns.service.inspections;

import com.minexpert.hns.dto.inspections.InspectionReportDTO;
import com.minexpert.hns.exception.HSException;

public interface InspectionReportService {
    Long createReport(InspectionReportDTO report) throws HSException;

    void updateReport(InspectionReportDTO report, Long companyId) throws HSException;

    InspectionReportDTO findById(Long id, Long companyId) throws HSException;

    InspectionReportDTO findByGeneralInspectionId(Long id, Long companyId) throws HSException;
}
