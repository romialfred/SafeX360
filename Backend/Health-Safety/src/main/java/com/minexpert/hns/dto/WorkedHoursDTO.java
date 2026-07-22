package com.minexpert.hns.dto;

import com.minexpert.hns.entity.incident.WorkedHours;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkedHoursDTO {
    private Long id;
    private Integer year;
    private Integer month;
    private Double hours;

    public static WorkedHoursDTO fromEntity(WorkedHours w) {
        return new WorkedHoursDTO(w.getId(), w.getYear(), w.getMonth(), w.getHours());
    }
}
