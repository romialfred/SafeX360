package com.minexpert.hns.dto.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRiskAnalysis;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChemicalRiskAnalysisDTO {
    private Long id;
    private Short gravity;
    private Short probability;
    private Short severity;
    private String riskLevel;
    private String currentControls;
    private String additionalControl;
    private String preventiveMeasures;
    private String improvementsMeasures;
    private String comments;
    private String reason;

    private Long riskId; // refers to ChemicalRisk.id

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ISO 45001 — Residual risk (B2)
    private Short residualProbability;
    private Short residualGravity;
    private Short residualSeverity;
    private String residualRiskLevel;

    // Cloisonnement par mine (companyId) — en DERNIER pour @AllArgsConstructor
    private Long companyId;

    public ChemicalRiskAnalysis toEntity(ChemicalRisk risk) {
        return new ChemicalRiskAnalysis(
                this.id,
                this.gravity,
                this.probability,
                this.severity,
                this.riskLevel,
                this.currentControls,
                this.additionalControl,
                this.preventiveMeasures,
                this.improvementsMeasures,
                this.comments,
                this.reason,
                risk,
                this.createdAt,
                this.updatedAt,
                this.residualProbability,
                this.residualGravity,
                this.residualSeverity,
                this.residualRiskLevel,
                this.companyId);
    }

    public static ChemicalRiskAnalysisDTO fromEntity(ChemicalRiskAnalysis analysis) {
        return new ChemicalRiskAnalysisDTO(
                analysis.getId(),
                analysis.getGravity(),
                analysis.getProbability(),
                analysis.getSeverity(),
                analysis.getRiskLevel(),
                analysis.getCurrentControls(),
                analysis.getAdditionalControl(),
                analysis.getPreventiveMeasures(),
                analysis.getImprovementsMeasures(),
                analysis.getComments(),
                analysis.getReason(),
                analysis.getChemicalRisk() != null ? analysis.getChemicalRisk().getId() : null,
                analysis.getCreatedAt(),
                analysis.getUpdatedAt(),
                analysis.getResidualProbability(),
                analysis.getResidualGravity(),
                analysis.getResidualSeverity(),
                analysis.getResidualRiskLevel(),
                analysis.getCompanyId());
    }
}

