package com.minexpert.hns.dto.compliance.dashboard;

import java.util.List;

/**
 * Paginated view of compliant employees for the dashboard table.
 */
public record ComplianceDashboardCompliantEmployeesResponse(
        int page,
        int pageSize,
        long total,
        List<ComplianceDashboardEmployeeRowDTO> employees) {
}
