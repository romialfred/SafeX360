package com.minexpert.hns.dto.compliance.dashboard;

/**
 * Department-level compliance breakdown.
 */
public record ComplianceDashboardDepartmentDTO(
        String name,
        long compliant,
        long upcoming,
        long expired,
        long missing) {
}
