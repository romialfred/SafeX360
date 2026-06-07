package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdDTO {

    private Long id;

    /** Null = seuil global par defaut. */
    private Long mineId;

    @NotNull
    private ThresholdGrandeur grandeur;

    @NotBlank
    private String personCategory;

    private Double doseConstraint;
    private Double investigationLevel;
    private Double actionLevel;
    private Double regulatoryLimit;

    /** JSON array d'entiers, ex. "[75,90]". */
    private String warnPercentages;

    @NotBlank
    private String unit;

    @NotBlank
    private String referenceFramework;

    private boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
