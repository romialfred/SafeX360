package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DosimeterAssignmentDTO {

    private Long id;

    @NotNull
    private Long dosimeterId;

    @NotNull
    private Long workerId;

    @NotNull
    private LocalDate periodStart;

    private LocalDate periodEnd;
    private boolean handoverAck;
    private LocalDateTime handoverAckAt;
    private boolean returnAck;
    private LocalDateTime returnAckAt;
    private String deviceCondition;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
