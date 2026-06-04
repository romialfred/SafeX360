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

    public CorrectiveAction toEntity() {
        return new CorrectiveAction(
                this.id,
                this.actionName,
                this.assignedEmployeeId,
                this.departmentId,
                this.ownerId,
                this.deadline,
                this.status,
                this.description,
                this.incidentId != null ? new Incident(incidentId) : null,
                this.generalInspectionId != null ? new GeneralInspection(generalInspectionId) : null,
                this.hsActivityId != null ? new HsActivity(hsActivityId) : null,
                this.nonConformityId != null ? new NonConformity(nonConformityId) : null,
                this.progress,
                this.companyId,
                this.createdAt,
                this.updatedAt);
    }
}
