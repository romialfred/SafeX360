package com.minexpert.hns.dto.inspections;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionReport;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionReportDTO {
    private Long id;
    private Long reportedId;
    private LocalDate reportDate;
    private String description;
    private List<MediaDTO> docs;
    private Long generalInspectionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public InspectionReport toEntity() {
        return new InspectionReport(id, reportedId, reportDate, description, null,
                generalInspectionId != null ? new GeneralInspection(generalInspectionId) : null, createdAt, updatedAt,
                companyId);
    }
}
