package com.minexpert.hns.dto.compliance.dashboard;

import java.time.LocalDate;

/**
 * Detailed item used in the action items response.
 */
public record ComplianceDashboardItemDTO(
        String id,
        String requirementTitle,
        ComplianceDashboardEmployeeDTO employee,
        String statusDetail,
        LocalDate expiredOn,
        LocalDate dueOn,
        String description) {
}
