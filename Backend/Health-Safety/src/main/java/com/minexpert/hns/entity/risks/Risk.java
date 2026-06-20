package com.minexpert.hns.entity.risks;

import com.minexpert.hns.entity.parameters.WorkProcess;
import jakarta.persistence.*;
import com.minexpert.hns.dto.risks.RiskDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "risks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Risk {
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

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public RiskDTO toDTO() {
        RiskDTO dto = new RiskDTO(
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
                this.createdAt,
                this.updatedAt,
                null,
                null,
                this.activityType,
                this.hazardCategory,
                this.personsExposed,
                this.exposureCount,
                this.legalRequirements,
                this.nextReviewDate);

        if (this.riskLevel != null && this.riskLevel.matches("^[1-5][1-5]$")) {
            dto.setProbability(Character.getNumericValue(this.riskLevel.charAt(0)));
            dto.setSeverity(Character.getNumericValue(this.riskLevel.charAt(1)));
        }
        return dto;
    }
}
