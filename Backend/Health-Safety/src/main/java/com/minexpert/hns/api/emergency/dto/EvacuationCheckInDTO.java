package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.CheckInStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EvacuationCheckInDTO {
    private Long id;
    private Long generalAlertId;
    private Long employeeId;
    private String employeeName;
    private String employeeDepartment;
    private String employeePosition;
    private Long assemblyPointId;
    private String assemblyPointName;
    private CheckInStatus status;
    private Double latitude;
    private Double longitude;
    private Float gpsAccuracy;
    private Long checkedBy;
    private String note;
    private LocalDateTime checkedAt;
}
