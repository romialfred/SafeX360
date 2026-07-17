package com.minexpert.hns.dto.indicator;

import com.minexpert.hns.entity.indicator.IndicatorPlanEntry;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO d'une periode de plan. Les champs persistes (target/forecast/actual...)
 * font l'aller-retour ; variancePct et status sont CALCULES par le service en
 * lecture (jamais recus du client, jamais stockes). Mapping par setters (et non
 * constructeur positionnel) car les champs calcules casseraient l'ordre.
 */
@Data
@NoArgsConstructor
public class IndicatorPlanEntryDTO {
    private Long id;
    private Long planId;
    private Integer periodIndex;
    private String periodLabel;
    private Double target;
    private Double forecast;
    private Double actual;
    private Long companyId;

    /** Ecart reel vs cible en % (calcule serveur, lecture seule). */
    private Double variancePct;
    /** PENDING (pas de reel) / ON_TARGET / OFF_TARGET, calcule serveur selon la direction. */
    private String status;

    public IndicatorPlanEntry toEntity() {
        IndicatorPlanEntry e = new IndicatorPlanEntry();
        e.setId(id);
        e.setPlanId(planId);
        e.setPeriodIndex(periodIndex);
        e.setPeriodLabel(periodLabel);
        e.setTarget(target);
        e.setForecast(forecast);
        e.setActual(actual);
        e.setCompanyId(companyId);
        return e;
    }
}
