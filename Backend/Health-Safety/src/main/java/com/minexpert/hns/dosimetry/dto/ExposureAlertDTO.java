package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExposureAlertDTO {

    private Long id;

    @NotNull
    private Long workerId;

    private Long zoneId;

    @NotNull
    private AlertLevel level;

    @NotNull
    private ThresholdGrandeur grandeur;

    @NotNull
    private Double value;

    @NotNull
    private Long thresholdId;

    private LocalDateTime triggeredAt;
    private LocalDateTime acknowledgedAt;
    private Long acknowledgedBy;

    @NotNull
    private AlertStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
