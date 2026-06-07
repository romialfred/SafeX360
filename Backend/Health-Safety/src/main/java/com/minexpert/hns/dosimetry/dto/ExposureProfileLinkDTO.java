package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExposureProfileLinkDTO {

    private Long id;

    @NotNull
    private Long exposureProfileId;

    @NotNull
    private Long measurementPointId;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private BigDecimal fraction;

    private BigDecimal estimatedDoseRate;

    private LocalDateTime lastUpdated;

    private LocalDateTime createdAt;
    private Long createdBy;
}
