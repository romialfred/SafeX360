package com.minexpert.hns.dto.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionMeasurement;
import com.minexpert.hns.entity.parameters.Measurement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionMeasurementDTO {
    private Long id;
    private Long measurementId;
    private Double value;
    private Long generalInspectionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public InspectionMeasurement toEntity() {
        return new InspectionMeasurement(this.id, new Measurement(measurementId), this.value,
                new GeneralInspection(this.generalInspectionId), this.createdAt, this.updatedAt,
                this.companyId);
    }
}
