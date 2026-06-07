package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Statistiques d'ambiance sur un point pour une periode donnee.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmbientMeasurementStatsDTO {

    private Long measurementPointId;
    private LocalDateTime from;
    private LocalDateTime to;
    private long count;
    private BigDecimal min;
    private BigDecimal max;
    private BigDecimal avg;
    private BigDecimal median;
    /** Niveau de reference du point (snapshot). */
    private BigDecimal referenceLevel;
    /** Nombre de mesures strictement superieures au niveau de reference. */
    private long overReferenceCount;
}
