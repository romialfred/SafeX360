package com.minexpert.hns.entity.indicator;

import com.minexpert.hns.dto.indicator.IndicatorPlanEntryDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Valeur d'une periode d'un plan : cible (target), prevision (forecast) et
 * reel (actual, saisi a posteriori, nullable). periodIndex ordonne les periodes
 * (1..12 mensuel, 1..4 trimestriel, 1 annuel) ; periodLabel est l'etiquette
 * canonique neutre ("Jan".."Dec", "Q1".."Q4", "Year") que l'IHM localise.
 */
@Entity
@Table(
        name = "indicator_plan_entry",
        indexes = {
                @Index(name = "idx_entry_plan", columnList = "planId"),
                @Index(name = "idx_entry_company", columnList = "companyId")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IndicatorPlanEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long planId;

    private Integer periodIndex;

    @Column(length = 16)
    private String periodLabel;

    private Double target;
    private Double forecast;
    private Double actual;

    /** Mine proprietaire (cloisonnement, redondant avec le plan pour requetes directes). */
    private Long companyId;

    /**
     * Mappe vers un DTO SANS les champs calcules (variancePct, status) : ceux-ci
     * sont poses par le service en lecture, en tenant compte de la direction de
     * l'indicateur. On ne les stocke pas.
     */
    public IndicatorPlanEntryDTO toDTO() {
        IndicatorPlanEntryDTO dto = new IndicatorPlanEntryDTO();
        dto.setId(id);
        dto.setPlanId(planId);
        dto.setPeriodIndex(periodIndex);
        dto.setPeriodLabel(periodLabel);
        dto.setTarget(target);
        dto.setForecast(forecast);
        dto.setActual(actual);
        dto.setCompanyId(companyId);
        return dto;
    }
}
