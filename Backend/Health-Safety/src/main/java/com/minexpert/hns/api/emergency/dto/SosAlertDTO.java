package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO SOS Alert (LOT 48 Phase 3.a).
 *
 * <p>Inclut les libellés résolus (nom employé, équipe, coordinateur) côté
 * service pour éviter des round-trips frontaux.</p>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SosAlertDTO {
    private Long id;
    private Long companyId;
    private Long employeeId;
    private String employeeName;
    private Long coordinatorId;
    private String coordinatorName;
    private Long rescueTeamId;
    private String rescueTeamName;

    private String reasonCode;
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
