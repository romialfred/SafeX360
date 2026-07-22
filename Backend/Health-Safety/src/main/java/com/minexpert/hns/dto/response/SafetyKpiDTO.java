package com.minexpert.hns.dto.response;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Indicateurs de fréquence des lésions (ISO 45001 §9.1.1 — ILO/OSHA), calculés
 * sur une année et une mine. Taux exprimés PAR MILLION d'heures travaillées
 * (convention minière ICMM). Null si aucune heure saisie (taux indéfini).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKpiDTO {
    private int year;
    private double hoursWorked;
    private long fatalities;
    private long ltiCount;
    private long recordableCount;
    private long lostDays;
    /** LTIFR = (LTI + décès) × 1 000 000 / heures. */
    private Double ltifr;
    /** TRIFR = (enregistrables) × 1 000 000 / heures. */
    private Double trifr;
    /** Taux de gravité = jours perdus × 1 000 000 / heures. */
    private Double severityRate;
    /** Répartition par issue normalisée (nom d'enum → effectif). */
    private Map<String, Long> outcomeBreakdown;
    /** Série mensuelle (1..12) : alimente les variations mois-à-mois des tuiles. */
    private List<MonthlyKpi> monthly;

    /** Indicateurs d'UN mois — taux mensuels (numérateur du mois / heures du mois). */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyKpi {
        private int month;
        private double hoursWorked;
        private long ltiCount;
        private long recordableCount;
        private long lostDays;
        private Double ltifr;
        private Double trifr;
        private Double severityRate;
    }
}
