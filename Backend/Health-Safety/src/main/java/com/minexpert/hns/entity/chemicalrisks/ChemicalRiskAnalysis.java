package com.minexpert.hns.entity.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chemical_risk_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalRiskAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chemical_risk_id", nullable = false)
    private ChemicalRisk chemicalRisk;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ISO 45001 — Residual risk (B2)
    @Column(name = "residual_probability")
    private Short residualProbability;

    @Column(name = "residual_gravity")
    private Short residualGravity;

    @Column(name = "residual_severity")
    private Short residualSeverity;

    @Column(name = "residual_risk_level")
    private String residualRiskLevel;

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

    public ChemicalRiskAnalysisDTO toDTO() {
        return new ChemicalRiskAnalysisDTO(
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
                this.chemicalRisk != null ? this.chemicalRisk.getId() : null,
                this.createdAt,
                this.updatedAt,
                this.residualProbability,
                this.residualGravity,
                this.residualSeverity,
                this.residualRiskLevel,
                this.companyId);
    }
}

