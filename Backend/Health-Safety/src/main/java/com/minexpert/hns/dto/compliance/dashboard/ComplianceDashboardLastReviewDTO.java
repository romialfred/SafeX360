package com.minexpert.hns.dto.compliance.dashboard;

import java.time.LocalDate;

/**
 * Represents the latest validation event for a compliant document.
 */
public record ComplianceDashboardLastReviewDTO(
        LocalDate completedOn,
        String validatedBy) {
}
