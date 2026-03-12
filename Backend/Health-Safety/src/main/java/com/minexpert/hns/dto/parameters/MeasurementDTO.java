package com.minexpert.hns.dto.parameters;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.parameters.Measurement;
import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MeasurementDTO {
    private Long id;
    private String name;
    private String unit;
    private Double normalValue;
    private Double threshold;
    private String description;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Measurement toEntity() {
        return new Measurement(this.id, this.name, this.unit, this.normalValue, this.threshold, this.description,
                this.status, this.createdAt, this.updatedAt);
    }
}
