package com.minexpert.hns.dto.compliance.dashboard;

import com.minexpert.hns.enums.Status;

/**
 * Lightweight view of an active requirement assignment for a position.
 */
public record RequirementAssignmentSummary(
        Long assignmentId,
        Long positionId,
        Long requirementId,
        String requirementTitle,
        String requirementDescription,
        String category,
        String renewalFrequency,
        String docType,
        Status status) {
}
