package com.minexpert.hns.dto.inspections;

import java.util.List;

import com.minexpert.hns.enums.InspectionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProcessDTO {
    private List<InspectionChecklistDTO> checklists;
    private List<InspectionMeasurementDTO> measurements;
    private InspectionInterviewsDTO interviews;
    private InspectionStatus status;
    private Long inspectionId;
}
