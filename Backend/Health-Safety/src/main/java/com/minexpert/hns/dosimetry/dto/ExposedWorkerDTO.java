package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExposedWorkerDTO {

    private Long id;

    @NotNull
    private Long employeeId;

    @NotNull
    private DoseCategory category;

    private String classificationReason;
    private LocalDate classificationDate;
    private Long rpoId;
    private DoseSpecialStatus specialStatus;
    private LocalDate specialStatusStartDate;
    private LocalDate specialStatusEndDate;
    private boolean active;

    @NotNull
    private Long mineId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
