package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.IncidentDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer probability;
    private Integer severity;
    @Lob
    private String existingControlMeasures;
    @Lob
    private String residualRiskAssessment;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RiskAssessment(Long id) {
        this.id = id;
    }

    public IncidentDTO toIncidentDTO(IncidentDTO incidentDTO) {
        incidentDTO.setProbability(probability);
        incidentDTO.setSeverity(severity);
        incidentDTO.setExistingControlMeasures(existingControlMeasures);
        incidentDTO.setResidualRiskAssessment(residualRiskAssessment);
        return incidentDTO;
    }
}
