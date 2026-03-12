package com.minexpert.hns.dto.risks;

import com.minexpert.hns.entity.risks.Risk;
import com.minexpert.hns.entity.risks.RiskAnalysis;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskAnalysisDTO {
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

    private Long riskId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RiskAnalysis toEntity(Risk risk) {
        return new RiskAnalysis(
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
                this.updatedAt);
    }

    public static RiskAnalysisDTO fromEntity(RiskAnalysis analysis) {
        return new RiskAnalysisDTO(
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
                analysis.getRisk() != null ? analysis.getRisk().getId() : null,
                analysis.getCreatedAt(),
                analysis.getUpdatedAt());
    }
}
