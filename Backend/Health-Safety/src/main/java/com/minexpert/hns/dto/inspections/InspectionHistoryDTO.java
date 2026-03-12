package com.minexpert.hns.dto.inspections;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionHistory;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.enums.InspectionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionHistoryDTO {
    private Long id;
    private Long ownerId;
    private LocalDate date;
    private InspectionStatus status;
    private String comment;
    private Long inspectionId;
    private LocalDateTime createdAt;

    public InspectionHistory toEntity() {
        return new InspectionHistory(id, ownerId, date, status, comment,
                inspectionId != null ? new GeneralInspection(inspectionId) : null,
                createdAt);
    }
}
