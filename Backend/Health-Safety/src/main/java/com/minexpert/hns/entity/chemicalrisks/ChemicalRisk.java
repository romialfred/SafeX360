package com.minexpert.hns.entity.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskDTO;
import com.minexpert.hns.entity.parameters.WorkProcess;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "chemical_risks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalRisk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_process_id", nullable = false)
    private WorkProcess workProcess;

    private String hazardSource;
    private String riskLevel;

    private String potentialConsequences;

    private Long ownerId;

    private LocalDate reviewDate;

    private String status;

    // Extra chemical risk fields
    private String chemicalName;
    private String casNumber;
    private String classification;
    private String methodOfUse;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ISO 45001 — Hazard identification (B1)
    @Column(name = "activity_type")
    private String activityType;

    @Column(name = "hazard_category")
    private String hazardCategory;

    @Column(name = "persons_exposed")
    private String personsExposed;

    @Column(name = "exposure_count")
    private Integer exposureCount;

    // ISO 45001 §6.1.3 — Legal & other requirements + next review (C1)
    @Column(name = "legal_requirements", length = 2000)
    private String legalRequirements;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    @Column(name = "company_id")
    private Long companyId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public ChemicalRiskDTO toDTO() {
        return new ChemicalRiskDTO(
                this.id,
                this.title,
                this.description,
                this.departmentId,
                this.workProcess != null ? this.workProcess.getId() : null,
                this.hazardSource,
                this.riskLevel,
                this.potentialConsequences,
                this.ownerId,
                this.reviewDate,
                this.status,
                this.chemicalName,
                this.casNumber,
                this.classification,
                this.methodOfUse,
                this.createdAt,
                this.updatedAt,
                this.activityType,
                this.hazardCategory,
                this.personsExposed,
                this.exposureCount,
                this.legalRequirements,
                this.nextReviewDate,
                this.companyId);
    }
}

