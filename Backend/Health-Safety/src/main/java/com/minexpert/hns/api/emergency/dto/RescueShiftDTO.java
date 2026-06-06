package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.minexpert.hns.api.emergency.enums.RescueShiftType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RescueShiftDTO {
    private Long id;
    private Long teamId;
    private RescueShiftType shiftType;
    private LocalTime startTime;
    private LocalTime endTime;
    private String daysOfWeek;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String status;
}
