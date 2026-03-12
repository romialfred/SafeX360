package com.minexpert.hns.dto.risks;

import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.entity.risks.Risk;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskDTO {
    private Long id;
    private String title;
    private String description;
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
                this.updatedAt);
    }

}
