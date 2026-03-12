package com.minexpert.hns.dto.compliance.dashboard;

/**
 * Employee summary used by the compliance dashboard payloads.
 */
public record ComplianceDashboardEmployeeDTO(
        String id,
        String name,
        String role,
        String department) {
}
