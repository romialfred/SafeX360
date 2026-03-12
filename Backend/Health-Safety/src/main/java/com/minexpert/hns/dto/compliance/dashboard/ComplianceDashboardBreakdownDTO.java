package com.minexpert.hns.dto.compliance.dashboard;

/**
 * Donut chart slice definition.
 */
public record ComplianceDashboardBreakdownDTO(
        String status,
        long count,
        String color) {
}
