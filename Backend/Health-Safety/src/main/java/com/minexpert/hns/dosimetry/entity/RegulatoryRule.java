package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.RegulatoryDoseType;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleApprovalStatus;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleKind;
import com.minexpert.hns.dosimetry.enums.RegulatoryRuleLifecycleStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Version immuable après approbation d'une règle dosimétrique locale.
 *
 * <p>Aucune valeur n'est préchargée : la qualification de la source et la décision
 * PCR/RPO, médicale et juridique restent des prérequis organisationnels. ISO 45001
 * 6.1.3 et 9.1.2 imposent la maîtrise des obligations et leur évaluation.</p>
 */
@Entity
@Table(name = "dosimetry_regulatory_rule",
        uniqueConstraints = @UniqueConstraint(name = "uk_reg_rule_code_version",
                columnNames = { "company_id", "rule_code", "version_number" }),
        indexes = {
                @Index(name = "idx_reg_rule_resolution", columnList =
                        "company_id, mine_id, country_code, jurisdiction_code, population_category, grandeur, rule_kind, approval_status"),
                @Index(name = "idx_reg_rule_effectivity", columnList =
                        "effective_from, effective_to, retired_effective_on")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulatoryRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "lock_version", nullable = false)
    private long lockVersion;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /** Mine optionnelle : null signifie portée société, jamais portée universelle. */
    @Column(name = "mine_id")
    private Long mineId;

    /** Site opérationnel optionnel au sein de la mine. */
    @Column(name = "site_code", length = 64)
    private String siteCode;

    @Column(name = "rule_code", nullable = false, length = 96)
    private String ruleCode;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "supersedes_rule_id")
    private Long supersedesRuleId;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "jurisdiction_code", nullable = false, length = 96)
    private String jurisdictionCode;

    @Column(name = "authority_name", nullable = false, length = 255)
    private String authorityName;

    @Column(name = "population_category", nullable = false, length = 32)
    private String populationCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "grandeur", nullable = false, length = 16)
    private ThresholdGrandeur grandeur;

    @Enumerated(EnumType.STRING)
    @Column(name = "dose_type", nullable = false, length = 32)
    private RegulatoryDoseType doseType;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_kind", nullable = false, length = 32)
    private RegulatoryRuleKind ruleKind;

    @Column(name = "rule_value", nullable = false)
    private Double value;

    @Column(name = "unit", nullable = false, length = 16)
    private String unit;

    @Column(name = "measurement_period_months", nullable = false)
    private Integer measurementPeriodMonths;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 16)
    private RegulatoryRuleApprovalStatus approvalStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 16)
    private RegulatoryRuleLifecycleStatus lifecycleStatus;

    @Column(name = "source_reference", nullable = false, length = 255)
    private String sourceReference;

    @Column(name = "source_version", nullable = false, length = 64)
    private String sourceVersion;

    @Column(name = "source_url", length = 1024)
    private String sourceUrl;

    @Column(name = "impact_assessment", nullable = false, columnDefinition = "TEXT")
    private String impactAssessment;

    @Column(name = "review_owner_id", nullable = false)
    private Long reviewOwnerId;

    @Column(name = "review_due_date", nullable = false)
    private LocalDate reviewDueDate;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_evidence", length = 1024)
    private String approvalEvidence;

    @Column(name = "retired_by")
    private Long retiredBy;

    @Column(name = "retired_at")
    private LocalDateTime retiredAt;

    @Column(name = "retired_effective_on")
    private LocalDate retiredEffectiveOn;

    @Column(name = "retirement_reason", length = 1024)
    private String retirementReason;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", nullable = false)
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
