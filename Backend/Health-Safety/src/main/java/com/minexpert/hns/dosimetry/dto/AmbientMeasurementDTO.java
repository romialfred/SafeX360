package com.minexpert.hns.dosimetry.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.MeasurementContext;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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
public class AmbientMeasurementDTO {

    private Long id;

    @NotNull
    private Long mineId;

    @NotNull
    private Long measurementPointId;

    @NotNull
    private LocalDateTime measuredAt;

    @NotNull
    private Long measuredBy;

    /** Valeur de H*(10) en uSv/h. */
    @NotNull
    @Positive
    private BigDecimal value;

    @PositiveOrZero
    private BigDecimal uncertainty;

    private Long instrumentId;
    private String instrumentSerial;

    @NotNull
    private MeasurementContext context;

    private Long campaignId;

    private String notes;

    private LocalDateTime createdAt;
    private Long createdBy;

    /** Indicateur "value &gt; referenceLevel" calcule cote service (lecture seule). */
    private Boolean aboveReferenceLevel;

    /** Variation relative par rapport a la mesure precedente sur le meme point (lecture seule). */
    private BigDecimal trendVsPrevious;
}
