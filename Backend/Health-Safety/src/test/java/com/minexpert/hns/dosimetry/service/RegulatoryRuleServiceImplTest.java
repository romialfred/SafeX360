package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleApprovalRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolveRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleRetirementRequest;
import com.minexpert.hns.dosimetry.entity.RegulatoryRule;
import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleApprovalStatus;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleLifecycleStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.RegulatoryRuleRepository;

@ExtendWith(MockitoExtension.class)
class RegulatoryRuleServiceImplTest {

    @Mock RegulatoryRuleRepository repository;
    @Mock DosimetryAuditLogRepository auditRepository;
    private RegulatoryRuleServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RegulatoryRuleServiceImpl(repository, auditRepository);
    }

    @Test
    void createForcesTenantAndAlwaysCreatesDraftWithoutInventingAValue() {
        RegulatoryRuleDTO dto = validDraft();
        dto.setCompanyId(999L);
        when(repository.findMaxVersion(7L, "CI-RP-001")).thenReturn(2);
        when(repository.save(any(RegulatoryRule.class))).thenAnswer(invocation -> {
            RegulatoryRule saved = invocation.getArgument(0);
            saved.setId(41L);
            return saved;
        });

        assertThat(service.create(7L, dto)).isEqualTo(41L);

        ArgumentCaptor<RegulatoryRule> captor = ArgumentCaptor.forClass(RegulatoryRule.class);
        verify(repository).save(captor.capture());
        RegulatoryRule saved = captor.getValue();
        assertThat(saved.getCompanyId()).isEqualTo(7L);
        assertThat(saved.getVersionNumber()).isEqualTo(3);
        assertThat(saved.getApprovalStatus()).isEqualTo(RegulatoryRuleApprovalStatus.DRAFT);
        assertThat(saved.getValue()).isEqualTo(12.5); // uniquement la valeur explicitement fournie
    }

    @Test
    void approvedVersionCannotBeSilentlyUpdated() {
        RegulatoryRule approved = approvedRule(51L, null, null, "CI");
        when(repository.findByIdAndCompanyId(51L, 7L)).thenReturn(Optional.of(approved));
        RegulatoryRuleDTO dto = validDraft();

        assertThatThrownBy(() -> service.update(7L, 51L, dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot be overwritten");

        verify(repository, never()).save(any(RegulatoryRule.class));
    }

    @Test
    void approvalRequiresReviewAndRejectsOverlappingApprovedScope() {
        RegulatoryRule inReview = approvedRule(52L, 7L, null, "CI");
        inReview.setApprovalStatus(RegulatoryRuleApprovalStatus.IN_REVIEW);
        inReview.setApprovedBy(null);
        inReview.setApprovedAt(null);
        inReview.setApprovalEvidence(null);
        RegulatoryRule existing = approvedRule(53L, 7L, null, "CI");
        when(repository.findByIdAndCompanyId(52L, 7L)).thenReturn(Optional.of(inReview));
        when(repository.findByCompanyIdOrderByRuleCodeAscVersionNumberDesc(7L))
                .thenReturn(List.of(inReview, existing));
        RegulatoryRuleApprovalRequest request = new RegulatoryRuleApprovalRequest();
        request.setApproverId(300L);
        request.setApprovalEvidence("PV de validation signé");

        assertThatThrownBy(() -> service.approve(7L, 52L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("retire it first");

        verify(repository, never()).save(inReview);
    }

    @Test
    void resolutionSelectsExactSiteOverMineWideRule() {
        LocalDate date = LocalDate.of(2026, 7, 19);
        RegulatoryRule mine = approvedRule(61L, 7L, null, "CI");
        RegulatoryRule site = approvedRule(62L, 7L, "PIT-NORD", "CI");
        site.setValue(9.0);
        when(repository.findApplicableCandidates(7L, "WORKER_A", ThresholdGrandeur.HP10,
                RegulatoryDoseType.PERSONAL_EXTERNAL, RegulatoryRuleKind.REGULATORY_LIMIT,
                12, date)).thenReturn(List.of(mine, site));

        RegulatoryRuleResolveRequest request = resolveRequest(date);
        request.setSiteCode("pit-nord");

        assertThat(service.resolve(7L, request))
                .hasValueSatisfying(result -> {
                    assertThat(result.getRuleId()).isEqualTo(62L);
                    assertThat(result.getValue()).isEqualTo(9.0);
                    assertThat(result.getSourceReference()).isEqualTo("DECISION-RP-2026");
                });
    }

    @Test
    void resolutionFailsClosedWhenTwoRulesHaveSameSpecificity() {
        LocalDate date = LocalDate.of(2026, 7, 19);
        RegulatoryRule a = approvedRule(71L, 7L, null, "CI");
        RegulatoryRule b = approvedRule(72L, 7L, null, "CI");
        b.setJurisdictionCode("CI-AUTRE");
        when(repository.findApplicableCandidates(7L, "WORKER_A", ThresholdGrandeur.HP10,
                RegulatoryDoseType.PERSONAL_EXTERNAL, RegulatoryRuleKind.REGULATORY_LIMIT,
                12, date)).thenReturn(List.of(a, b));

        assertThat(service.resolveUnambiguousForMine(7L, 7L, null, "WORKER_A",
                ThresholdGrandeur.HP10, RegulatoryDoseType.PERSONAL_EXTERNAL,
                RegulatoryRuleKind.REGULATORY_LIMIT, 12, date)).isEmpty();
    }

    @Test
    void draftOrUnqualifiedLegacyRuleIsIgnoredEvenIfRepositoryReturnsIt() {
        LocalDate date = LocalDate.of(2026, 7, 19);
        RegulatoryRule legacy = approvedRule(81L, 7L, null, "CI");
        legacy.setApprovalStatus(RegulatoryRuleApprovalStatus.DRAFT);
        legacy.setApprovedBy(null);
        legacy.setApprovalEvidence(null);
        when(repository.findApplicableCandidates(7L, "WORKER_A", ThresholdGrandeur.HP10,
                RegulatoryDoseType.PERSONAL_EXTERNAL, RegulatoryRuleKind.REGULATORY_LIMIT,
                12, date)).thenReturn(List.of(legacy));

        assertThat(service.resolveUnambiguousForMine(7L, 7L, null, "WORKER_A",
                ThresholdGrandeur.HP10, RegulatoryDoseType.PERSONAL_EXTERNAL,
                RegulatoryRuleKind.REGULATORY_LIMIT, 12, date)).isEmpty();
    }

    @Test
    void controlledRetirementPreservesHistoryBeforeItsEffectiveDate() {
        RegulatoryRule rule = approvedRule(91L, 7L, null, "CI");
        when(repository.findByIdAndCompanyId(91L, 7L)).thenReturn(Optional.of(rule));
        RegulatoryRuleRetirementRequest request = new RegulatoryRuleRetirementRequest();
        request.setActorId(300L);
        request.setEffectiveOn(LocalDate.of(2027, 1, 1));
        request.setReason("Nouvelle décision réglementaire applicable");

        service.retire(7L, 91L, request);

        assertThat(rule.getApprovalStatus()).isEqualTo(RegulatoryRuleApprovalStatus.APPROVED);
        assertThat(rule.getLifecycleStatus()).isEqualTo(RegulatoryRuleLifecycleStatus.RETIRED);
        assertThat(rule.getRetiredEffectiveOn()).isEqualTo(LocalDate.of(2027, 1, 1));
        verify(repository).save(rule);
    }

    private RegulatoryRuleDTO validDraft() {
        RegulatoryRuleDTO dto = new RegulatoryRuleDTO();
        dto.setLockVersion(0L);
        dto.setMineId(7L);
        dto.setRuleCode("CI-RP-001");
        dto.setCountryCode("CI");
        dto.setJurisdictionCode("CI-NATIONAL");
        dto.setAuthorityName("Autorité locale compétente");
        dto.setPopulationCategory("WORKER_A");
        dto.setGrandeur(ThresholdGrandeur.HP10);
        dto.setDoseType(RegulatoryDoseType.PERSONAL_EXTERNAL);
        dto.setRuleKind(RegulatoryRuleKind.REGULATORY_LIMIT);
        dto.setValue(12.5);
        dto.setUnit("mSv");
        dto.setMeasurementPeriodMonths(12);
        dto.setEffectiveFrom(LocalDate.of(2026, 1, 1));
        dto.setEffectiveTo(LocalDate.of(2026, 12, 31));
        dto.setSourceReference("DECISION-RP-2026");
        dto.setSourceVersion("VERSION-1");
        dto.setImpactAssessment("Analyse d'impact à valider par les fonctions compétentes.");
        dto.setReviewOwnerId(200L);
        dto.setReviewDueDate(LocalDate.of(2026, 12, 1));
        dto.setCreatedBy(100L);
        return dto;
    }

    private RegulatoryRule approvedRule(Long id, Long mineId, String siteCode, String country) {
        return RegulatoryRule.builder()
                .id(id).lockVersion(0L).companyId(7L).mineId(mineId).siteCode(siteCode)
                .ruleCode("CI-RP-001").versionNumber(1).countryCode(country)
                .jurisdictionCode("CI-NATIONAL").authorityName("Autorité locale compétente")
                .populationCategory("WORKER_A").grandeur(ThresholdGrandeur.HP10)
                .doseType(RegulatoryDoseType.PERSONAL_EXTERNAL)
                .ruleKind(RegulatoryRuleKind.REGULATORY_LIMIT).value(12.5).unit("mSv")
                .measurementPeriodMonths(12).effectiveFrom(LocalDate.of(2026, 1, 1))
                .effectiveTo(LocalDate.of(2026, 12, 31))
                .approvalStatus(RegulatoryRuleApprovalStatus.APPROVED)
                .lifecycleStatus(RegulatoryRuleLifecycleStatus.ACTIVE)
                .sourceReference("DECISION-RP-2026").sourceVersion("VERSION-1")
                .impactAssessment("Analyse d'impact validée").reviewOwnerId(200L)
                .reviewDueDate(LocalDate.of(2026, 12, 1)).approvedBy(300L)
                .approvedAt(LocalDateTime.of(2025, 12, 15, 9, 0))
                .approvalEvidence("PV signé").createdBy(100L).updatedBy(300L)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
    }

    private RegulatoryRuleResolveRequest resolveRequest(LocalDate date) {
        RegulatoryRuleResolveRequest request = new RegulatoryRuleResolveRequest();
        request.setMineId(7L);
        request.setCountryCode("CI");
        request.setJurisdictionCode("CI-NATIONAL");
        request.setPopulationCategory("WORKER_A");
        request.setGrandeur(ThresholdGrandeur.HP10);
        request.setDoseType(RegulatoryDoseType.PERSONAL_EXTERNAL);
        request.setRuleKind(RegulatoryRuleKind.REGULATORY_LIMIT);
        request.setMeasurementPeriodMonths(12);
        request.setApplicableOn(date);
        return request;
    }
}
