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
public class IncidentAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Lob
    private String factualDescription;
    @Lob
    private String immediateCauses;
    @Lob
    private String rootCauses;
    @Lob
    private String contributingFactors;
    @Lob
    private String immediateConsequences;
    @Lob
    private String potentialConsequences;
    @Lob
    private String immediateActions;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentAnalysis(Long id) {
        this.id = id;
    }

    public IncidentDTO toIncidentDTO(IncidentDTO incidentDTO) {
        incidentDTO.setFactualDescription(factualDescription);
        incidentDTO.setImmediateCauses(immediateCauses);
        incidentDTO.setRootCauses(rootCauses);
        incidentDTO.setContributingFactors(contributingFactors);
        incidentDTO.setImmediateConsequences(immediateConsequences);
        incidentDTO.setPotentialConsequences(potentialConsequences);
        incidentDTO.setImmediateActions(immediateActions);

        return incidentDTO;
    }
}
