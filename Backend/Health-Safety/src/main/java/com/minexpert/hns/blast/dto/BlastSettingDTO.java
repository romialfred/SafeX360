package com.minexpert.hns.blast.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parametres du module Blast Management exposes pour edition par
 * {@code BLAST_ADMIN}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastSettingDTO {

    private Long id;

    @NotNull
    private Long mineId;

    @Min(1)
    private int reminder24hOffsetMinutes;

    @Min(1)
    private int reminder6hOffsetMinutes;

    @Min(1)
    private int reminder30mOffsetMinutes;

    @Min(1)
    private int popupCadenceMinutes;

    @Min(1)
    private int popupWindowMinutes;

    @Min(1)
    private int generalAlarmOffsetMinutes;

    private String defaultTimezone;
    private String smtpFromAddress;
    private String controlRoomLabel;

    private LocalDateTime updatedAt;
    private Long updatedBy;
}
