package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.ZoneClass;

import jakarta.validation.constraints.NotBlank;
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
public class MeasurementPointDTO {

    private Long id;

    @NotNull
    private Long mineId;

    @NotBlank
    private String code;

    @NotBlank
    private String label;

    private Long zoneId;
    private String description;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal elevation;

    @NotNull
    private ZoneClass zoneClassification;

    private BigDecimal referenceLevel;

    private boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
    private Long version;
}
