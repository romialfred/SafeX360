package com.minexpert.hns.dto.response;

import java.time.LocalDate;

import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CorrectiveActionResponse {
    private Long id;
    private String actionName;
    private Long incidentId;
    private String incidentTitle;
    private Long assignedEmployeeId;
    private String assignedEmployeeName;
    private Long departmentId;
    private Long ownerId;
    private LocalDate deadline;
    private ActionStatus status;
    private String description;
    private Integer progress;
    private String type;

    public CorrectiveActionResponse(Long id, String actionName, Long incidentId, String incidentTitle,
            Long assignedEmployeeId, String assignedEmployeeName, Long departmentId, Long ownerId,
            LocalDate deadline, ActionStatus status, String description, Integer progress, EventType type) {
        this.id = id;
        this.actionName = actionName;
        this.incidentId = incidentId;
        this.incidentTitle = incidentTitle;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeName = assignedEmployeeName;
        this.departmentId = departmentId;
        this.ownerId = ownerId;
        this.deadline = deadline;
        this.status = status;
        this.description = description;
        this.progress = progress;
        this.type = type.toString();
    }
}
