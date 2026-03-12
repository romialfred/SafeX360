package com.minexpert.hns.dto.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.parameters.WorkProcess;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChemicalRiskDTO {
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

    // Extra chemical risk fields
    private String chemicalName;
    private String casNumber;
    private String classification;
    private String methodOfUse;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ChemicalRisk toEntity() {
        return new ChemicalRisk(
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
                this.chemicalName,
                this.casNumber,
                this.classification,
                this.methodOfUse,
                this.createdAt,
                this.updatedAt);
    }
}

