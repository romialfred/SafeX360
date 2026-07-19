package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleApprovalStatus;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleLifecycleStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Contrat d'administration d'une version de règle réglementaire. */
@Getter
@Setter
@NoArgsConstructor
public class RegulatoryRuleDTO {
    private Long id;
    private long lockVersion;
    private Long companyId;
    private Long mineId;
    @Size(max = 64)
    private String siteCode;
    @NotBlank @Size(max = 96)
    private String ruleCode;
    private int versionNumber;
    private Long supersedesRuleId;
    @NotBlank @Size(min = 2, max = 2)
    private String countryCode;
    @NotBlank @Size(max = 96)
    private String jurisdictionCode;
    @NotBlank @Size(max = 255)
    private String authorityName;
    @NotBlank @Size(max = 32)
    private String populationCategory;
    @NotNull
    private ThresholdGrandeur grandeur;
    @NotNull
    private RegulatoryDoseType doseType;
    @NotNull
    private RegulatoryRuleKind ruleKind;
    @NotNull @Positive
    private Double value;
    @NotBlank @Size(max = 16)
    private String unit;
    @NotNull @Positive
    private Integer measurementPeriodMonths;
    @NotNull
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private RegulatoryRuleApprovalStatus approvalStatus;
    private RegulatoryRuleLifecycleStatus lifecycleStatus;
    @NotBlank @Size(max = 255)
    private String sourceReference;
    @NotBlank @Size(max = 64)
    private String sourceVersion;
    @Size(max = 1024)
    private String sourceUrl;
    @NotBlank
    private String impactAssessment;
    @NotNull @Positive
    private Long reviewOwnerId;
    @NotNull
    private LocalDate reviewDueDate;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private String approvalEvidence;
    private Long retiredBy;
    private LocalDateTime retiredAt;
    private LocalDate retiredEffectiveOn;
    private String retirementReason;
    @NotNull @Positive
    private Long createdBy;
    private LocalDateTime createdAt;
    private Long updatedBy;
    private LocalDateTime updatedAt;
}
