package com.minexpert.hns.blast.service;

import com.minexpert.hns.blast.dto.BlastDashboardDTO;

/**
 * Service du tableau de bord Blast Management (P7).
 *
 * <p>Construit l'agregat {@link BlastDashboardDTO} a partir des entites de tirs,
 * jobs de notification et evenements de transition de statut. Tout est calcule
 * a la demande (pas de cache materialise) car le volume reste raisonnable
 * (quelques dizaines de tirs / mois / site) et la fraicheur prime sur la
 * performance pure.
 */
public interface BlastDashboardService {

    /**
     * Construit le tableau de bord pour une mine donnee.
     *
     * @param mineId identifiant du site (multi-tenant). Obligatoire.
     * @return agregat consolide (jamais {@code null}).
     */
    BlastDashboardDTO getSummary(Long mineId);
}
