package com.minexpert.hns.dto.compliance.dashboard;

/**
 * Represents a single compliant employee row in the dashboard table.
 */
public record ComplianceDashboardEmployeeRowDTO(
        String employeeId,
        String name,
        String jobTitle,
        String department,
        String requirement,
        ComplianceDashboardLastReviewDTO lastReview,
        ComplianceDashboardNextReviewDTO nextReview) {
}
