package com.minexpert.hns.dosimetry.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleApprovalRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolveRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolutionDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleRetirementRequest;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.RegulatoryRule;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleApprovalStatus;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleLifecycleStatus;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.RegulatoryRuleRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/** Moteur de gouvernance et de résolution des règles locales. */
@Service
@Transactional
@RequiredArgsConstructor
public class RegulatoryRuleServiceImpl implements RegulatoryRuleService {

    private final RegulatoryRuleRepository repository;
    private final DosimetryAuditLogRepository auditRepository;

    @Override
    public Long create(Long companyId, RegulatoryRuleDTO dto) {
        requireCompany(companyId);
        validateDraft(dto);
        LocalDateTime now = LocalDateTime.now();
        RegulatoryRule rule = new RegulatoryRule();
        copyEditable(dto, rule);
        rule.setCompanyId(companyId); // le tenant du payload n'est jamais accepté.
        rule.setVersionNumber(repository.findMaxVersion(companyId, rule.getRuleCode()) + 1);
        rule.setApprovalStatus(RegulatoryRuleApprovalStatus.DRAFT);
        rule.setLifecycleStatus(RegulatoryRuleLifecycleStatus.ACTIVE);
        rule.setCreatedBy(dto.getCreatedBy());
        rule.setUpdatedBy(dto.getCreatedBy());
        rule.setCreatedAt(now);
        rule.setUpdatedAt(now);
        RegulatoryRule saved = repository.save(rule);
        audit("REGULATORY_RULE_CREATED", saved, dto.getCreatedBy(), "draft-created");
        return saved.getId();
    }

    @Override
    public void update(Long companyId, Long id, RegulatoryRuleDTO dto) {
        requireCompany(companyId);
        validateDraft(dto);
        RegulatoryRule rule = getEntity(companyId, id);
        requireDraft(rule);
        if (dto.getLockVersion() != rule.getLockVersion()) {
            throw new IllegalStateException("REGULATORY_RULE_STALE_VERSION");
        }
        String originalCode = rule.getRuleCode();
        copyEditable(dto, rule);
        if (!originalCode.equals(rule.getRuleCode())) {
            throw new IllegalArgumentException("Rule code cannot change after creation");
        }
        Long actor = positiveOrFallback(dto.getUpdatedBy(), dto.getCreatedBy());
        rule.setUpdatedBy(actor);
        rule.setUpdatedAt(LocalDateTime.now());
        repository.save(rule);
        audit("REGULATORY_RULE_UPDATED", rule, actor, "draft-updated");
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegulatoryRuleDTO> getAll(Long companyId) {
        requireCompany(companyId);
        return repository.findByCompanyIdOrderByRuleCodeAscVersionNumberDesc(companyId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RegulatoryRuleDTO getById(Long companyId, Long id) {
        requireCompany(companyId);
        return toDto(getEntity(companyId, id));
    }

    @Override
    public void submitForReview(Long companyId, Long id, Long actorId) {
        requireActor(actorId);
        RegulatoryRule rule = getEntity(companyId, id);
        requireDraft(rule);
        validateQualifiedContent(rule);
        rule.setApprovalStatus(RegulatoryRuleApprovalStatus.IN_REVIEW);
        rule.setUpdatedBy(actorId);
        rule.setUpdatedAt(LocalDateTime.now());
        repository.save(rule);
        audit("REGULATORY_RULE_SUBMITTED", rule, actorId, "submitted-for-review");
    }

    @Override
    public void approve(Long companyId, Long id, RegulatoryRuleApprovalRequest request) {
        requireCompany(companyId);
        requireActor(request == null ? null : request.getApproverId());
        RegulatoryRule rule = getEntity(companyId, id);
        if (rule.getApprovalStatus() != RegulatoryRuleApprovalStatus.IN_REVIEW) {
            throw new IllegalStateException("Only a rule in review can be approved");
        }
        validateQualifiedContent(rule);
        requireText(request.getApprovalEvidence(), "Approval evidence is required");
        rejectApprovedOverlap(rule);
        rule.setApprovalStatus(RegulatoryRuleApprovalStatus.APPROVED);
        rule.setApprovedBy(request.getApproverId());
        rule.setApprovedAt(LocalDateTime.now());
        rule.setApprovalEvidence(request.getApprovalEvidence().trim());
        rule.setUpdatedBy(request.getApproverId());
        rule.setUpdatedAt(LocalDateTime.now());
        repository.save(rule);
        audit("REGULATORY_RULE_APPROVED", rule, request.getApproverId(),
                "approval-evidence-recorded");
    }

    @Override
    public Long createNextVersion(Long companyId, Long id, Long actorId) {
        requireCompany(companyId);
        requireActor(actorId);
        RegulatoryRule source = getEntity(companyId, id);
        if (source.getApprovalStatus() == RegulatoryRuleApprovalStatus.DRAFT) {
            throw new IllegalStateException("Update the existing draft instead of creating a version");
        }
        RegulatoryRule next = new RegulatoryRule();
        copyRuleContent(source, next);
        next.setCompanyId(companyId);
        next.setVersionNumber(repository.findMaxVersion(companyId, source.getRuleCode()) + 1);
        next.setSupersedesRuleId(source.getId());
        next.setApprovalStatus(RegulatoryRuleApprovalStatus.DRAFT);
        next.setLifecycleStatus(RegulatoryRuleLifecycleStatus.ACTIVE);
        next.setCreatedBy(actorId);
        next.setUpdatedBy(actorId);
        next.setCreatedAt(LocalDateTime.now());
        next.setUpdatedAt(next.getCreatedAt());
        RegulatoryRule saved = repository.save(next);
        audit("REGULATORY_RULE_VERSION_CREATED", saved, actorId,
                "supersedes=" + source.getId());
        return saved.getId();
    }

    @Override
    public void retire(Long companyId, Long id, RegulatoryRuleRetirementRequest request) {
        requireCompany(companyId);
        requireActor(request == null ? null : request.getActorId());
        requireText(request.getReason(), "Retirement reason is required");
        if (request.getEffectiveOn() == null) {
            throw new IllegalArgumentException("Retirement effective date is required");
        }
        RegulatoryRule rule = getEntity(companyId, id);
        if (rule.getApprovalStatus() != RegulatoryRuleApprovalStatus.APPROVED
                || rule.getLifecycleStatus() != RegulatoryRuleLifecycleStatus.ACTIVE) {
            throw new IllegalStateException("Only an active approved rule can be retired");
        }
        if (request.getEffectiveOn().isBefore(rule.getEffectiveFrom())) {
            throw new IllegalArgumentException("Retirement cannot precede the effective date");
        }
        rule.setLifecycleStatus(RegulatoryRuleLifecycleStatus.RETIRED);
        rule.setRetiredBy(request.getActorId());
        rule.setRetiredAt(LocalDateTime.now());
        rule.setRetiredEffectiveOn(request.getEffectiveOn());
        rule.setRetirementReason(request.getReason().trim());
        rule.setUpdatedBy(request.getActorId());
        rule.setUpdatedAt(LocalDateTime.now());
        repository.save(rule);
        audit("REGULATORY_RULE_RETIRED", rule, request.getActorId(),
                "effectiveOn=" + request.getEffectiveOn());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RegulatoryRuleResolutionDTO> resolve(Long companyId,
            RegulatoryRuleResolveRequest request) {
        requireCompany(companyId);
        if (request == null || request.getApplicableOn() == null
                || request.getGrandeur() == null || request.getDoseType() == null
                || request.getRuleKind() == null || request.getMeasurementPeriodMonths() == null) {
            return Optional.empty();
        }
        String population = normalizeCode(request.getPopulationCategory());
        if (population == null) return Optional.empty();
        List<RegulatoryRule> candidates = repository.findApplicableCandidates(
                companyId, population, request.getGrandeur(), request.getDoseType(),
                request.getRuleKind(), request.getMeasurementPeriodMonths(),
                request.getApplicableOn());

        String country = normalizeCode(request.getCountryCode());
        String jurisdiction = normalizeCode(request.getJurisdictionCode());
        Long mineId = request.getMineId();
        String site = normalizeNullable(request.getSiteCode());
        Predicate<RegulatoryRule> contextMatch = r -> country != null
                && country.equals(r.getCountryCode())
                && jurisdiction != null && jurisdiction.equals(r.getJurisdictionCode())
                && (r.getMineId() == null || r.getMineId().equals(mineId))
                && (r.getSiteCode() == null || r.getSiteCode().equals(site));
        return selectUnambiguous(candidates.stream()
                .filter(r -> isQualifiedApplicable(r, request.getApplicableOn()))
                .filter(contextMatch).toList());
    }

    /** Résolution interne sans contexte juridictionnel : un conflit conduit volontairement à vide. */
    @Transactional(readOnly = true)
    public Optional<RegulatoryRuleResolutionDTO> resolveUnambiguousForMine(
            Long companyId, Long mineId, String siteCode, String populationCategory,
            com.minexpert.hns.dosimetry.enums.ThresholdGrandeur grandeur,
            com.minexpert.hns.dosimetry.enums.RegulatoryDoseType doseType,
            com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind ruleKind,
            int periodMonths, LocalDate applicableOn) {
        requireCompany(companyId);
        List<RegulatoryRule> candidates = repository.findApplicableCandidates(
                companyId, normalizeCode(populationCategory), grandeur, doseType,
                ruleKind, periodMonths, applicableOn);
        String site = normalizeNullable(siteCode);
        List<RegulatoryRule> scoped = candidates.stream()
                .filter(r -> isQualifiedApplicable(r, applicableOn))
                .filter(r -> r.getMineId() == null || r.getMineId().equals(mineId))
                .filter(r -> r.getSiteCode() == null || r.getSiteCode().equals(site))
                .toList();
        return selectUnambiguous(scoped);
    }

    private boolean isQualifiedApplicable(RegulatoryRule rule, LocalDate date) {
        if (rule.getApprovalStatus() != RegulatoryRuleApprovalStatus.APPROVED
                || rule.getApprovedBy() == null || rule.getApprovedAt() == null
                || rule.getApprovalEvidence() == null || rule.getApprovalEvidence().isBlank()
                || rule.getSourceReference() == null || rule.getSourceReference().isBlank()
                || rule.getSourceVersion() == null || rule.getSourceVersion().isBlank()
                || rule.getAuthorityName() == null || rule.getAuthorityName().isBlank()
                || rule.getEffectiveFrom() == null || date == null
                || rule.getEffectiveFrom().isAfter(date)
                || (rule.getEffectiveTo() != null && rule.getEffectiveTo().isBefore(date))) {
            return false;
        }
        return rule.getRetiredEffectiveOn() == null || rule.getRetiredEffectiveOn().isAfter(date);
    }

    private Optional<RegulatoryRuleResolutionDTO> selectUnambiguous(List<RegulatoryRule> candidates) {
        if (candidates.isEmpty()) return Optional.empty();
        int maxSpecificity = candidates.stream().mapToInt(this::specificity).max().orElse(-1);
        List<RegulatoryRule> best = candidates.stream()
                .filter(r -> specificity(r) == maxSpecificity)
                .sorted(Comparator.comparing(RegulatoryRule::getEffectiveFrom).reversed()
                        .thenComparing(RegulatoryRule::getVersionNumber).reversed())
                .toList();
        if (best.size() != 1) {
            // Fail-closed : aucune autorité/juridiction/version n'est choisie arbitrairement.
            return Optional.empty();
        }
        return Optional.of(toResolution(best.get(0)));
    }

    private int specificity(RegulatoryRule rule) {
        if (rule.getSiteCode() != null) return 2;
        if (rule.getMineId() != null) return 1;
        return 0;
    }

    private void rejectApprovedOverlap(RegulatoryRule candidate) {
        List<RegulatoryRule> approved = repository
                .findByCompanyIdOrderByRuleCodeAscVersionNumberDesc(candidate.getCompanyId())
                .stream()
                .filter(r -> !r.getId().equals(candidate.getId()))
                .filter(r -> r.getApprovalStatus() == RegulatoryRuleApprovalStatus.APPROVED)
                .filter(r -> sameDecisionScope(r, candidate))
                .filter(r -> periodsOverlap(r, candidate))
                .toList();
        if (!approved.isEmpty()) {
            throw new IllegalStateException(
                    "An approved rule already covers this scope and period; retire it first");
        }
    }

    private boolean sameDecisionScope(RegulatoryRule a, RegulatoryRule b) {
        return java.util.Objects.equals(a.getMineId(), b.getMineId())
                && java.util.Objects.equals(a.getSiteCode(), b.getSiteCode())
                && a.getCountryCode().equals(b.getCountryCode())
                && a.getJurisdictionCode().equals(b.getJurisdictionCode())
                && a.getPopulationCategory().equals(b.getPopulationCategory())
                && a.getGrandeur() == b.getGrandeur()
                && a.getDoseType() == b.getDoseType()
                && a.getRuleKind() == b.getRuleKind()
                && a.getMeasurementPeriodMonths().equals(b.getMeasurementPeriodMonths());
    }

    private boolean periodsOverlap(RegulatoryRule a, RegulatoryRule b) {
        LocalDate aEnd = effectiveEnd(a);
        LocalDate bEnd = effectiveEnd(b);
        return (aEnd == null || !aEnd.isBefore(b.getEffectiveFrom()))
                && (bEnd == null || !bEnd.isBefore(a.getEffectiveFrom()));
    }

    private LocalDate effectiveEnd(RegulatoryRule rule) {
        LocalDate end = rule.getEffectiveTo();
        if (rule.getRetiredEffectiveOn() != null) {
            LocalDate retirementEnd = rule.getRetiredEffectiveOn().minusDays(1);
            if (end == null || retirementEnd.isBefore(end)) end = retirementEnd;
        }
        return end;
    }

    private void validateDraft(RegulatoryRuleDTO dto) {
        if (dto == null) throw new IllegalArgumentException("Rule payload is required");
        if (dto.getValue() == null || dto.getValue() <= 0d) {
            throw new IllegalArgumentException("Rule value must be positive");
        }
        if (dto.getMeasurementPeriodMonths() == null || dto.getMeasurementPeriodMonths() <= 0) {
            throw new IllegalArgumentException("Measurement period must be positive");
        }
        if (dto.getEffectiveFrom() == null
                || (dto.getEffectiveTo() != null
                && dto.getEffectiveTo().isBefore(dto.getEffectiveFrom()))) {
            throw new IllegalArgumentException("Rule effective dates are inconsistent");
        }
        requireActor(dto.getCreatedBy());
        requireText(dto.getRuleCode(), "Rule code is required");
    }

    private void validateQualifiedContent(RegulatoryRule rule) {
        requireText(rule.getCountryCode(), "Country is required");
        if (rule.getCountryCode().length() != 2) {
            throw new IllegalArgumentException("Country code must use two letters");
        }
        requireText(rule.getJurisdictionCode(), "Jurisdiction is required");
        requireText(rule.getAuthorityName(), "Authority is required");
        requireText(rule.getSourceReference(), "Source reference is required");
        requireText(rule.getSourceVersion(), "Source version is required");
        requireText(rule.getImpactAssessment(), "Impact assessment is required");
        requireActor(rule.getReviewOwnerId());
        if (rule.getReviewDueDate() == null) {
            throw new IllegalArgumentException("Review due date is required");
        }
        if (rule.getEffectiveTo() != null && rule.getEffectiveTo().isBefore(rule.getEffectiveFrom())) {
            throw new IllegalArgumentException("Rule effective dates are inconsistent");
        }
    }

    private void copyEditable(RegulatoryRuleDTO dto, RegulatoryRule rule) {
        rule.setMineId(dto.getMineId());
        rule.setSiteCode(normalizeNullable(dto.getSiteCode()));
        rule.setRuleCode(normalizeCode(dto.getRuleCode()));
        rule.setCountryCode(normalizeCode(dto.getCountryCode()));
        rule.setJurisdictionCode(normalizeCode(dto.getJurisdictionCode()));
        rule.setAuthorityName(trim(dto.getAuthorityName()));
        rule.setPopulationCategory(normalizeCode(dto.getPopulationCategory()));
        rule.setGrandeur(dto.getGrandeur());
        rule.setDoseType(dto.getDoseType());
        rule.setRuleKind(dto.getRuleKind());
        rule.setValue(dto.getValue());
        rule.setUnit(trim(dto.getUnit()));
        rule.setMeasurementPeriodMonths(dto.getMeasurementPeriodMonths());
        rule.setEffectiveFrom(dto.getEffectiveFrom());
        rule.setEffectiveTo(dto.getEffectiveTo());
        rule.setSourceReference(trim(dto.getSourceReference()));
        rule.setSourceVersion(trim(dto.getSourceVersion()));
        rule.setSourceUrl(trim(dto.getSourceUrl()));
        rule.setImpactAssessment(trim(dto.getImpactAssessment()));
        rule.setReviewOwnerId(dto.getReviewOwnerId());
        rule.setReviewDueDate(dto.getReviewDueDate());
    }

    private void copyRuleContent(RegulatoryRule source, RegulatoryRule target) {
        target.setMineId(source.getMineId());
        target.setSiteCode(source.getSiteCode());
        target.setRuleCode(source.getRuleCode());
        target.setCountryCode(source.getCountryCode());
        target.setJurisdictionCode(source.getJurisdictionCode());
        target.setAuthorityName(source.getAuthorityName());
        target.setPopulationCategory(source.getPopulationCategory());
        target.setGrandeur(source.getGrandeur());
        target.setDoseType(source.getDoseType());
        target.setRuleKind(source.getRuleKind());
        target.setValue(source.getValue());
        target.setUnit(source.getUnit());
        target.setMeasurementPeriodMonths(source.getMeasurementPeriodMonths());
        target.setEffectiveFrom(source.getEffectiveFrom());
        target.setEffectiveTo(source.getEffectiveTo());
        target.setSourceReference(source.getSourceReference());
        target.setSourceVersion(source.getSourceVersion());
        target.setSourceUrl(source.getSourceUrl());
        target.setImpactAssessment(source.getImpactAssessment());
        target.setReviewOwnerId(source.getReviewOwnerId());
        target.setReviewDueDate(source.getReviewDueDate());
    }

    private RegulatoryRule getEntity(Long companyId, Long id) {
        requireCompany(companyId);
        return repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new EntityNotFoundException("Regulatory rule not found: " + id));
    }

    private void requireDraft(RegulatoryRule rule) {
        if (rule.getApprovalStatus() != RegulatoryRuleApprovalStatus.DRAFT) {
            throw new IllegalStateException(
                    "An approved or reviewed version cannot be overwritten; create a new version");
        }
    }

    private void audit(String action, RegulatoryRule rule, Long actorId, String detail) {
        auditRepository.save(DosimetryAuditLog.builder()
                .action(action)
                .entityType("RegulatoryRule")
                .entityId(rule.getId())
                .userId(actorId)
                .timestamp(LocalDateTime.now())
                .details("{\"companyId\":" + rule.getCompanyId()
                        + ",\"ruleCode\":\"" + escape(rule.getRuleCode())
                        + "\",\"version\":" + rule.getVersionNumber()
                        + ",\"detail\":\"" + escape(detail) + "\"}")
                .build());
    }

    private RegulatoryRuleResolutionDTO toResolution(RegulatoryRule r) {
        return RegulatoryRuleResolutionDTO.builder()
                .ruleId(r.getId()).ruleCode(r.getRuleCode()).versionNumber(r.getVersionNumber())
                .value(r.getValue()).unit(r.getUnit()).countryCode(r.getCountryCode())
                .jurisdictionCode(r.getJurisdictionCode()).authorityName(r.getAuthorityName())
                .sourceReference(r.getSourceReference()).sourceVersion(r.getSourceVersion())
                .effectiveFrom(r.getEffectiveFrom()).effectiveTo(r.getEffectiveTo()).build();
    }

    private RegulatoryRuleDTO toDto(RegulatoryRule r) {
        RegulatoryRuleDTO dto = new RegulatoryRuleDTO();
        dto.setId(r.getId()); dto.setLockVersion(r.getLockVersion());
        dto.setCompanyId(r.getCompanyId()); dto.setMineId(r.getMineId());
        dto.setSiteCode(r.getSiteCode()); dto.setRuleCode(r.getRuleCode());
        dto.setVersionNumber(r.getVersionNumber()); dto.setSupersedesRuleId(r.getSupersedesRuleId());
        dto.setCountryCode(r.getCountryCode()); dto.setJurisdictionCode(r.getJurisdictionCode());
        dto.setAuthorityName(r.getAuthorityName()); dto.setPopulationCategory(r.getPopulationCategory());
        dto.setGrandeur(r.getGrandeur()); dto.setDoseType(r.getDoseType()); dto.setRuleKind(r.getRuleKind());
        dto.setValue(r.getValue()); dto.setUnit(r.getUnit());
        dto.setMeasurementPeriodMonths(r.getMeasurementPeriodMonths());
        dto.setEffectiveFrom(r.getEffectiveFrom()); dto.setEffectiveTo(r.getEffectiveTo());
        dto.setApprovalStatus(r.getApprovalStatus()); dto.setLifecycleStatus(r.getLifecycleStatus());
        dto.setSourceReference(r.getSourceReference()); dto.setSourceVersion(r.getSourceVersion());
        dto.setSourceUrl(r.getSourceUrl()); dto.setImpactAssessment(r.getImpactAssessment());
        dto.setReviewOwnerId(r.getReviewOwnerId()); dto.setReviewDueDate(r.getReviewDueDate());
        dto.setApprovedBy(r.getApprovedBy()); dto.setApprovedAt(r.getApprovedAt());
        dto.setApprovalEvidence(r.getApprovalEvidence()); dto.setRetiredBy(r.getRetiredBy());
        dto.setRetiredAt(r.getRetiredAt()); dto.setRetiredEffectiveOn(r.getRetiredEffectiveOn());
        dto.setRetirementReason(r.getRetirementReason()); dto.setCreatedBy(r.getCreatedBy());
        dto.setCreatedAt(r.getCreatedAt()); dto.setUpdatedBy(r.getUpdatedBy()); dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }

    private void requireCompany(Long companyId) {
        if (companyId == null || companyId <= 0) throw new IllegalArgumentException("Company scope is required");
    }

    private void requireActor(Long actorId) {
        if (actorId == null || actorId <= 0) throw new IllegalArgumentException("A named actor is required");
    }

    private Long positiveOrFallback(Long preferred, Long fallback) {
        Long value = preferred != null ? preferred : fallback;
        requireActor(value);
        return value;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
    }

    private String normalizeCode(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        return normalizeCode(value);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
