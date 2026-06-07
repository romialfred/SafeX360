package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoseCumulativeDTO {

    private Long id;

    @NotNull
    private Long workerId;

    @Min(1970)
    private int year;

    private Double annualHp10;
    private Double annualHp007;
    private Double annualHp3;
    private Double rolling5yHp10;
    private Double lifetimeHp10;

    private LocalDateTime updatedAt;
}
