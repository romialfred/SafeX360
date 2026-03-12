package com.minexpert.hns.dto.compliance.dashboard;

import java.time.LocalDate;
import java.util.List;

/**
 * Response payload for the department summary chart.
 */
public record ComplianceDashboardDepartmentSummaryResponse(
        LocalDate asOf,
        List<ComplianceDashboardDepartmentDTO> departments) {
}
