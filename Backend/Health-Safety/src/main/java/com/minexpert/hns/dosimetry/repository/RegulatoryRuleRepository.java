package com.minexpert.hns.dosimetry.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.RegulatoryRule;
import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

@Repository
public interface RegulatoryRuleRepository extends JpaRepository<RegulatoryRule, Long> {

    Optional<RegulatoryRule> findByIdAndCompanyId(Long id, Long companyId);

    List<RegulatoryRule> findByCompanyIdOrderByRuleCodeAscVersionNumberDesc(Long companyId);

    @Query("SELECT COALESCE(MAX(r.versionNumber), 0) FROM RegulatoryRule r "
            + "WHERE r.companyId = :companyId AND r.ruleCode = :ruleCode")
    int findMaxVersion(@Param("companyId") Long companyId,
            @Param("ruleCode") String ruleCode);

    @Query("SELECT r FROM RegulatoryRule r WHERE r.companyId = :companyId "
            + "AND r.populationCategory = :populationCategory "
            + "AND r.grandeur = :grandeur AND r.doseType = :doseType "
            + "AND r.ruleKind = :ruleKind "
            + "AND r.measurementPeriodMonths = :periodMonths "
            + "AND r.approvalStatus = com.minexpert.hns.dosimetry.enums.RegulatoryRuleApprovalStatus.APPROVED "
            + "AND r.effectiveFrom <= :applicableOn "
            + "AND (r.effectiveTo IS NULL OR r.effectiveTo >= :applicableOn) "
            + "AND (r.retiredEffectiveOn IS NULL OR r.retiredEffectiveOn > :applicableOn)")
    List<RegulatoryRule> findApplicableCandidates(
            @Param("companyId") Long companyId,
            @Param("populationCategory") String populationCategory,
            @Param("grandeur") ThresholdGrandeur grandeur,
            @Param("doseType") RegulatoryDoseType doseType,
            @Param("ruleKind") RegulatoryRuleKind ruleKind,
            @Param("periodMonths") Integer periodMonths,
            @Param("applicableOn") LocalDate applicableOn);
}
