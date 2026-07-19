package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Contexte complet de décision pour une résolution fail-closed. */
@Getter
@Setter
@NoArgsConstructor
public class RegulatoryRuleResolveRequest {
    private Long companyId;
    private Long mineId;
    @Size(max = 64)
    private String siteCode;
    @NotBlank @Size(min = 2, max = 2)
    private String countryCode;
    @NotBlank @Size(max = 96)
    private String jurisdictionCode;
    @NotBlank @Size(max = 32)
    private String populationCategory;
    @NotNull
    private ThresholdGrandeur grandeur;
    @NotNull
    private RegulatoryDoseType doseType;
    @NotNull
    private RegulatoryRuleKind ruleKind;
    @NotNull @Positive
    private Integer measurementPeriodMonths;
    @NotNull
    private LocalDate applicableOn;
}
