package com.minexpert.hns.api.emergency.dto;

import com.minexpert.hns.api.emergency.enums.EvacPriorityLevel;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvacuationPriorityDTO {
    private Long id;

    @NotNull
    private Long companyId;

    @NotNull
    private Long employeeId;

    @NotNull
    private EvacPriorityLevel level;

    private String roleLabel;
    private String note;
}
