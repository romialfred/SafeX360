package com.minexpert.hns.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.entity.incident.RiskAssessment;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.IncidentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentDTO {
    private Long id;
    private String number;
    private String title;
    private List<String> ppe;
    private Long locationId;
    private List<Long> weatherConditions;
    private Long departmentId;
    private Long companyId;
    private IncidentStatus status;
    private LocalDateTime occurredAt;
    private LocalDateTime discoveryTime;
    private Long workAreaId;
    private Long workProcessId;
    private List<IncidentDetailDTO> incidentDetails;

    private Long reporterId;
    private List<Long> involvedPersons;
    private List<Long> witnesses;
    private List<MediaDTO> evidence;

    private String factualDescription;
    private String immediateCauses;
    private String rootCauses;
    private String contributingFactors;
    private String immediateConsequences;
    private String potentialConsequences;
    private String immediateActions;

    private Integer probability;
    private Integer severity;
    private String existingControlMeasures;
    private String residualRiskAssessment;
    private String departmentName;

    /**
     * Origine de la declaration : "EMPLOYEE" (par defaut) ou "AI" (Wizard Declaration IA Vision).
     * Permet le filtre Source sur la page Gestion des incidents.
     */
    private String source;
    /** Confiance de l'analyse IA, entre 0 et 1 (uniquement si source=AI). */
    private Double aiConfidence;
    /** Modele IA utilise (ex: "claude-sonnet-4-5"). */
    private String aiModel;

    public Incident toIncident() {
        Incident incident = new Incident();
        incident.setId(id);
        incident.setNumber(number);
        incident.setTitle(title);
        incident.setPpe(ppe != null ? ppe.toString() : null);
        incident.setLocation(locationId != null ? new Location(locationId) : null);
        incident.setWeatherConditions(weatherConditions != null ? weatherConditions.toString() : null);
        incident.setDepartmentId(departmentId);
        incident.setCompanyId(companyId);
        incident.setOccurredAt(occurredAt);
        incident.setDiscoveryTime(discoveryTime);
        incident.setWorkArea(workAreaId != null ? new WorkArea(workAreaId) : null);
        incident.setWorkProcess(workProcessId != null ? new WorkProcess(workProcessId) : null);
        incident.setReporterId(reporterId);
        incident.setStatus(status);
        incident.setInvolvedPersons(involvedPersons != null ? involvedPersons.toString() : null);
        incident.setWitnesses(witnesses != null ? witnesses.toString() : null);
        // Trace l'origine : par defaut EMPLOYEE si non specifie (saisie classique).
        incident.setSource(source != null && !source.isBlank() ? source.toUpperCase() : "EMPLOYEE");
        incident.setAiConfidence(aiConfidence);
        incident.setAiModel(aiModel);
        return incident;
    }

    public IncidentAnalysis toIncidentAnalysis() {
        return new IncidentAnalysis(null, factualDescription, immediateCauses, rootCauses, contributingFactors,
                immediateConsequences, potentialConsequences, immediateActions, null,
                null, null);
    }

    public RiskAssessment toRiskAssessment() {
        return new RiskAssessment(null, probability, severity, existingControlMeasures, residualRiskAssessment, null,
                null, null);
    }
}
