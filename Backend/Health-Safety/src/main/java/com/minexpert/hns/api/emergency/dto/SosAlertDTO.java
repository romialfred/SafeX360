package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SosAlertDTO {
    private Long id;
    @NotNull(message = "companyId is required")
    private Long companyId;
    @NotNull(message = "employeeId is required")
    private Long employeeId;
    private String employeeName;
    private Long coordinatorId;
    private String coordinatorName;
    private Long rescueTeamId;
    private String rescueTeamName;

    @NotNull(message = "reasonCode is required")
    @Size(max = 100, message = "reasonCode must not exceed 100 characters")
    private String reasonCode;
    @Size(max = 2000, message = "description must not exceed 2000 characters")
    private String description;
    private Double latitude;
    private Double longitude;
    private Float gpsAccuracy;

    private SosStatus status;
    private Boolean drillMode;
    private String falseAlarmReason;

    private LocalDateTime triggeredAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime onSiteAt;
    private LocalDateTime closedAt;

    /** Durée écoulée entre déclenchement et état actuel (calculée serveur). */
    private Long elapsedSeconds;
}
