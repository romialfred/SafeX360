package com.minexpert.hns.dto.compliance.dashboard;

import java.util.List;

/**
 * Response payload for the overall compliance donut chart.
 */
public record ComplianceDashboardOverallStatusResponse(
        long totalRequirements,
        List<ComplianceDashboardBreakdownDTO> breakdown) {
}
