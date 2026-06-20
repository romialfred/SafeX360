package com.minexpert.hns.dto.error;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agregats KPI du module Gestion des Erreurs (tableau de bord).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorKpiDTO {
    private long total;
    /** Repartition par statut (cle = nom du statut). */
    private Map<String, Long> countByStatus;
    /** Repartition par type d'evenement (cle = id du type). */
    private Map<Long, Long> countByEventType;
    /** Repartition par niveau de criticite (cle = nom du niveau). */
    private Map<String, Long> countByCriticality;
    /** Nombre d'evenements a potentiel eleve (HiPo / SIF). */
    private long hipoCount;
    /** Nombre de presqu'accidents (near-miss). */
    private long nearMissCount;
    /** Nombre d'accidents. */
    private long accidentCount;
    /** Ratio presqu'accidents / accidents (indicateur de remontee des signaux faibles). */
    private double nearMissAccidentRatio;
    /** CAPA en retard rattachees a des evenements erreur. */
    private long overdueCapa;
    /** Causes recurrentes (libelle + occurrences), triees par frequence decroissante. */
    private List<RecurrentCause> recurrentCauses;
    /** Proxy de maturite : part des declarations anonymes + presqu'accidents (0..1). */
    private double maturityProxy;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecurrentCause {
        private String label;
        private long occurrences;
    }
}
