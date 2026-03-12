package com.minexpert.hns.dto.compliance.dashboard;

import jakarta.validation.constraints.NotNull;

public record ComplianceDashboardAlertRequest(
        @NotNull(message = "employeeId is required") Long employeeId,
        @NotNull(message = "requirementId is required") Long requirementId) {
}
