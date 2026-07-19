package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GeneralAlertDTO {
    private Long id;
    private Long companyId;
    private Long triggeredBy;
    private String triggeredByName;
    private Long endedBy;
    private String endedByName;
    private GeneralAlertStatus status;
    private String reasonCode;
    private String message;
    private Boolean drillMode;

    /** Périmètre de zones : "ALL" ou "SELECTION". */
    private String zoneScope;
    /** Zones ciblées (ids de Location) si SELECTION. */
    private List<Long> zoneIds;
    /** Noms des zones ciblées, pour affichage direct aux destinataires. */
    private List<String> zoneNames;

    private LocalDateTime triggeredAt;
    private LocalDateTime endedAt;
    private Long elapsedSeconds;

    /** Statistiques d'évacuation calculées côté serveur. */
    private Integer totalEmployees;
    private Integer checkedInCount;
    private Integer safeCount;
    private Integer injuredCount;
    private Integer missingCount;
}
