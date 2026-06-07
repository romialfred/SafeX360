package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

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
public class ExposureProfileDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @NotBlank
    private String exposureType;

    private Long zoneId;
    private Long postId;
    private String frequency;
    private String conditions;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
