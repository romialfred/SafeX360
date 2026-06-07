package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.DoseSource;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO du DoseRecord.
 *
 * <p>Les valeurs hp10/hp007/hp3 sont contraintes :
 * <ul>
 *   <li>>= 0.0 (pas de dose negative)</li>
 *   <li>{@literal <}= 2000.0 mSv (safety cap absolu - une lecture au-dela = donnee aberrante a investiguer)</li>
 * </ul>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoseRecordDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotBlank
    private String period;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp10;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp007;

    @DecimalMin("0.0")
    @Max(value = 2000L)
    private Double hp3;

    @NotNull
    private DoseSource source;

    private boolean belowDetection;
    private String attachmentUrls;
    private String notes;

    private Long recordedBy;
    private LocalDateTime recordedAt;

    private int version;
    private Long supersededRecordId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
