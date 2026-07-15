package com.minexpert.hns.dto.inspections;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionInterviews;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionInterviewsDTO {
    private Long id;
    private List<Long> employees;
    private LocalDateTime interviewDate;
    private String description;
    private Long generalInspectionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public InspectionInterviews toEntity() {
        return new InspectionInterviews(this.id, this.employees != null ? this.employees.toString() : null,
                this.interviewDate, this.description,
                new GeneralInspection(this.generalInspectionId), createdAt, updatedAt,
                this.companyId);
    }

}
