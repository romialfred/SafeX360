package com.minexpert.hns.dto.risks;

import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.entity.risks.Risk;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskDTO {
    private Long id;
    @NotBlank(message = "title is required")
    @Size(max = 255, message = "title must not exceed 255 characters")
    private String title;
    @Size(max = 4000, message = "description must not exceed 4000 characters")
    private String description;
    @NotNull(message = "departmentId is required")
    private Long departmentId;
    private Long workProcessId;
    private String hazardSource;
    private String riskLevel;
    private String potentialConsequences;
    private Long ownerId;
    private LocalDate reviewDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Derived from riskLevel (e.g., "23" -> probability=2, severity=3)
    private Integer probability;
    private Integer severity;

    // ISO 45001 — Hazard identification (B1)
    private String activityType;
    private String hazardCategory;
    private String personsExposed;
    private Integer exposureCount;

    // ISO 45001 §6.1.3 — Legal & other requirements + next review (C1)
    private String legalRequirements;
    private LocalDate nextReviewDate;

    public Risk toEntity() {
        return new Risk(
                this.id,
                this.title,
                this.description,
                this.departmentId,
                new WorkProcess(workProcessId),
                this.hazardSource,
                this.riskLevel,
                this.potentialConsequences,
                this.ownerId,
                this.reviewDate,
                this.status,
                this.createdAt,
                this.updatedAt,
                this.activityType,
                this.hazardCategory,
                this.personsExposed,
                this.exposureCount,
                this.legalRequirements,
                this.nextReviewDate);
    }

}
