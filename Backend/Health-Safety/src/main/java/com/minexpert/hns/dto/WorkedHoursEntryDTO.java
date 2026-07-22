package com.minexpert.hns.dto;

import com.minexpert.hns.entity.incident.WorkedHoursEntry;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkedHoursEntryDTO {
    private Long id;
    private Integer year;
    private Integer month;
    /** DEPARTMENT | SUBCONTRACTOR. */
    private String laborType;
    private Long departmentId;
    private String subcontractorName;
    private Double hours;
    /** Nom du département résolu (HRMS), non persisté — confort d'affichage. */
    private String departmentName;

    public static WorkedHoursEntryDTO fromEntity(WorkedHoursEntry w) {
        return new WorkedHoursEntryDTO(w.getId(), w.getYear(), w.getMonth(), w.getLaborType(),
                w.getDepartmentId(), w.getSubcontractorName(), w.getHours(), null);
    }
}
