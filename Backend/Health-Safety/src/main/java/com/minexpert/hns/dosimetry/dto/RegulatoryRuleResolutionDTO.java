package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/** Preuve de la version effectivement sélectionnée par le moteur. */
@Getter
@Builder
public class RegulatoryRuleResolutionDTO {
    private Long ruleId;
    private String ruleCode;
    private int versionNumber;
    private Double value;
    private String unit;
    private String countryCode;
    private String jurisdictionCode;
    private String authorityName;
    private String sourceReference;
    private String sourceVersion;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
