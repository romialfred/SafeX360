package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO du plan de tir (sous-objet de {@link BlastCreateDTO} / {@link BlastDetailDTO}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastPlanDTO {

    private Long id;
    private Integer holeCount;
    private Double holeDiameterMm;
    private Double depthM;
    private Double burdenM;
    private Double spacingM;
    private Double stemmingM;
    private String explosiveType;
    private Double explosiveQtyKg;
    private Double powderFactor;
    private String initiationSystem;
    private String delaySequence;
}
