package com.minexpert.hns.dosimetry.service;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleApprovalRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolveRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolutionDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleRetirementRequest;
import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

public interface RegulatoryRuleService {
    Long create(Long companyId, RegulatoryRuleDTO dto);
    void update(Long companyId, Long id, RegulatoryRuleDTO dto);
    List<RegulatoryRuleDTO> getAll(Long companyId);
    RegulatoryRuleDTO getById(Long companyId, Long id);
    void submitForReview(Long companyId, Long id, Long actorId);
    void approve(Long companyId, Long id, RegulatoryRuleApprovalRequest request);
    Long createNextVersion(Long companyId, Long id, Long actorId);
    void retire(Long companyId, Long id, RegulatoryRuleRetirementRequest request);
    Optional<RegulatoryRuleResolutionDTO> resolve(Long companyId,
            RegulatoryRuleResolveRequest request);
    Optional<RegulatoryRuleResolutionDTO> resolveUnambiguousForMine(Long companyId,
            Long mineId, String siteCode, String populationCategory,
            ThresholdGrandeur grandeur, RegulatoryDoseType doseType,
            RegulatoryRuleKind ruleKind, int periodMonths, LocalDate applicableOn);
}
