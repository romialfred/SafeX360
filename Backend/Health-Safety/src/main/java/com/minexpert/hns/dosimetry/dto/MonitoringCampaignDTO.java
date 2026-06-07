package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.dosimetry.enums.CampaignStatus;

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
public class MonitoringCampaignDTO {

    private Long id;

    @NotNull
    private Long mineId;

    @NotBlank
    private String code;

    @NotBlank
    private String label;

    private String objective;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;

    private CampaignStatus status;

    private String protocol;

    private Long responsibleId;

    @Builder.Default
    private List<Long> measurementPointIds = new ArrayList<>();

    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;
    private Long updatedBy;
    private LocalDateTime completedAt;
    private Long completedBy;
}
