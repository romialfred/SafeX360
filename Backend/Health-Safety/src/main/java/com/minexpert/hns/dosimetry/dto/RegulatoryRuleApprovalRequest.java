package com.minexpert.hns.dosimetry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Décision nominative d'approbation. */
@Getter
@Setter
@NoArgsConstructor
public class RegulatoryRuleApprovalRequest {
    @NotNull @Positive
    private Long approverId;
    @NotBlank @Size(max = 1024)
    private String approvalEvidence;
}
