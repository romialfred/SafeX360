package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.IncidentDTO;

import jakarta.persistence.Column;
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
    // Risque APRES mesures (ISO 45001 §8.1.2) : ré-évaluation structurée
    // probabilité×gravité, pendant dosé du risque initial (probability/severity).
    // Colonnes additives (ddl-auto=update) ; complète le texte libre historique
    // residualRiskAssessment sans le remplacer.
    @Column(name = "post_probability")
    private Integer postProbability;
    @Column(name = "post_severity")
    private Integer postSeverity;
    // Sévérité/probabilité POTENTIELLES (ICMM / ISO 45001 §6.1.2) : pire scénario
    // crédible de l'événement, distinct du réel. Pilote le triage Haut Potentiel.
    @Column(name = "potential_probability")
    private Integer potentialProbability;
    @Column(name = "potential_severity")
    private Integer potentialSeverity;
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
        incidentDTO.setPostProbability(postProbability);
        incidentDTO.setPostSeverity(postSeverity);
        incidentDTO.setPotentialProbability(potentialProbability);
        incidentDTO.setPotentialSeverity(potentialSeverity);
        incidentDTO.setExistingControlMeasures(existingControlMeasures);
        incidentDTO.setResidualRiskAssessment(residualRiskAssessment);
        return incidentDTO;
    }
}
