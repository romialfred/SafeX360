package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.activities.HsActivity;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.ActionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CorrectiveActionDTO {
    private Long id;
    private String actionName;
    private Long assignedEmployeeId;
    private Long departmentId;
    private Long ownerId;
    private LocalDate deadline;
    private ActionStatus status;
    private String description;
    private Long companyId;
    private Integer progress;
    private Long incidentId;
    private Long generalInspectionId;
    private Long hsActivityId;
    private Long nonConformityId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Lien federateur (souple) vers un controle du « Plan de maitrise » d'un risque.
    private Long riskControlId;
    // Lien (souple) vers LA cause traitee par cette action (ISO 45001 §10.2 a-b).
    private Long causeId;

    public CorrectiveAction toEntity() {
        // Construction par setters (et non par le constructeur positionnel
        // @AllArgsConstructor) : l'entite gagne des colonnes au fil des evolutions
        // (revue d'efficacite ISO 45001 §10.2, risque residuel...) et un mapping
        // positionnel casserait silencieusement a chaque ajout.
        CorrectiveAction entity = new CorrectiveAction();
        entity.setId(this.id);
        entity.setActionName(this.actionName);
        entity.setAssignedEmployeeId(this.assignedEmployeeId);
        entity.setDepartmentId(this.departmentId);
        entity.setOwnerId(this.ownerId);
        entity.setDeadline(this.deadline);
        entity.setStatus(this.status);
        entity.setDescription(this.description);
        entity.setIncident(this.incidentId != null ? new Incident(incidentId) : null);
        entity.setGeneralInspection(
                this.generalInspectionId != null ? new GeneralInspection(generalInspectionId) : null);
        entity.setHsActivity(this.hsActivityId != null ? new HsActivity(hsActivityId) : null);
        entity.setNonConformity(this.nonConformityId != null ? new NonConformity(nonConformityId) : null);
        entity.setProgress(this.progress);
        entity.setCompanyId(this.companyId);
        entity.setCreatedAt(this.createdAt);
        entity.setUpdatedAt(this.updatedAt);
        entity.setRiskControlId(this.riskControlId);
        entity.setCauseId(this.causeId);
        return entity;
    }
}
