package com.minexpert.hns.repository.projection;

/**
 * Projection (mois, effectif) pour les tendances mensuelles.
 *
 * <p>Les mois sans aucune ligne sont ABSENTS du résultat : c'est au service de
 * compléter les 12 mois à 0.</p>
 */
public interface MonthCount {
    Integer getMonth();

    Long getTotal();
}
