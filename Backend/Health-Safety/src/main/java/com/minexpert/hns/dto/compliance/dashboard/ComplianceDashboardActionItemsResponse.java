package com.minexpert.hns.dto.compliance.dashboard;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response payload for the action items dashboard tile.
 */
public record ComplianceDashboardActionItemsResponse(
        List<ComplianceDashboardStatusDTO> statuses,
        OffsetDateTime lastUpdated) {
}
