package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolutionDTO;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

@ExtendWith(MockitoExtension.class)
class RegulatoryLimitResolverTest {

    @Mock RegulatoryRuleService regulatoryRuleService;
    private RegulatoryLimitResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new RegulatoryLimitResolver(regulatoryRuleService);
    }

    @Test
    void workerBSixIsNeverResolvedAsRegulatoryLimit() {
        stubResolution("WORKER_B", 6.0);

        assertThat(resolver.resolveAnnualHp10(7L, KpiCategory.WORKER_B,
                LocalDate.of(2026, 12, 31))).isEmpty();
    }

    @Test
    void approvedJurisdictionalValueIsResolved() {
        stubResolution("WORKER_A", 12.0);

        assertThat(resolver.resolveAnnualHp10(7L, KpiCategory.WORKER_A,
                LocalDate.of(2026, 12, 31))).contains(12.0);
    }

    @Test
    void absenceOrAmbiguityNeverFallsBackToLegacyThreshold() {
        when(regulatoryRuleService.resolveUnambiguousForMine(
                eq(7L), eq(7L), any(), eq("WORKER_A"), eq(ThresholdGrandeur.HP10),
                eq(RegulatoryDoseType.PERSONAL_EXTERNAL),
                eq(RegulatoryRuleKind.REGULATORY_LIMIT), eq(12), any()))
                .thenReturn(Optional.empty());

        assertThat(resolver.resolveAnnualHp10(7L, KpiCategory.WORKER_A,
                LocalDate.of(2026, 12, 31))).isEmpty();
    }

    private void stubResolution(String category, double value) {
        RegulatoryRuleResolutionDTO resolution = RegulatoryRuleResolutionDTO.builder()
                .ruleId(1L).ruleCode("LOCAL-RP").versionNumber(1)
                .value(value).unit("mSv").build();
        when(regulatoryRuleService.resolveUnambiguousForMine(
                eq(7L), eq(7L), any(), eq(category), eq(ThresholdGrandeur.HP10),
                eq(RegulatoryDoseType.PERSONAL_EXTERNAL),
                eq(RegulatoryRuleKind.REGULATORY_LIMIT), eq(12), any()))
                .thenReturn(Optional.of(resolution));
    }
}
