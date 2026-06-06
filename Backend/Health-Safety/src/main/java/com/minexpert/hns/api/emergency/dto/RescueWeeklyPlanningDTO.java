package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO planification hebdomadaire d'urgence (LOT 48 Phase 1.c.2).
 *
 * <p>Inclut les noms des équipes (lookup côté service) pour faciliter l'affichage
 * UI sans round-trip supplémentaire.</p>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RescueWeeklyPlanningDTO {
    private Long id;
    private Long companyId;
    private LocalDate weekStartDate;

    private Long dayTeamId;
    private String dayTeamName;        // lookup côté service

    private Long nightTeamId;
    private String nightTeamName;      // lookup côté service

    private String dayStartHour;       // default "06:00"
    private String dayEndHour;         // default "18:00"
    private String nightStartHour;     // default "18:00"
    private String nightEndHour;       // default "06:00"

    private String notes;
    private String status;
}
