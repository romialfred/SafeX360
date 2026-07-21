package com.hrms.dto;

import java.util.List;

import com.hrms.entity.EvacuationPriorityLevel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEvacuationDTO {
    private Long employeeId;
    private Long companyId;
    private String employeeName;
    private String department;
    private String positionName;
    /** true si l'employé est un directeur (→ P1 automatique). */
    private boolean director;
    /** Priorité explicitement enregistrée (peut être null). */
    private EvacuationPriorityLevel priorityLevel;
    /** Priorité effective = enregistrée, sinon P1 si directeur, sinon null. */
    private EvacuationPriorityLevel effectivePriority;
    private Long assemblyPointId;
    private String specialNeeds;
    private List<EmergencyContactDTO> contacts;
}
