package com.minexpert.hns.dto.compliance.dashboard;

import java.time.LocalDate;

/**
 * Metadata about the upcoming review cycle for a compliant document.
 */
public record ComplianceDashboardNextReviewDTO(
        LocalDate dueOn,
        long daysUntilDue) {
}
