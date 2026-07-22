package com.minexpert.hns.dto;

import com.minexpert.hns.entity.incident.IncidentInjury;
import com.minexpert.hns.enums.InjuryOutcome;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncidentInjuryDTO {
    private Long id;
    private Long incidentId;
    private Long employeeId;
    private String personName;
    /** Nom résolu de l'employé (HRMS) pour l'affichage. */
    private String employeeName;
    private InjuryOutcome outcome;
    private String natureOfInjury;
    private String bodyPart;
    private Integer lostDays;

    public static IncidentInjuryDTO fromEntity(IncidentInjury i) {
        IncidentInjuryDTO d = new IncidentInjuryDTO();
        d.setId(i.getId());
        d.setIncidentId(i.getIncidentId());
        d.setEmployeeId(i.getEmployeeId());
        d.setPersonName(i.getPersonName());
        d.setOutcome(i.getOutcome());
        d.setNatureOfInjury(i.getNatureOfInjury());
        d.setBodyPart(i.getBodyPart());
        d.setLostDays(i.getLostDays());
        return d;
    }
}
