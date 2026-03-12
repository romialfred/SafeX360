package com.minexpert.hns.dto.compliance.dashboard;

import java.util.List;

/**
 * Groups action items by high-level compliance status.
 */
public record ComplianceDashboardStatusDTO(
        String code,
        String label,
        long count,
        List<ComplianceDashboardItemDTO> items) {
}
