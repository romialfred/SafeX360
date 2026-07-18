package com.minexpert.hns.service.dashboard;

import com.minexpert.hns.dto.dashboard.DashboardOhsDTO;
import com.minexpert.hns.exception.HSException;

/**
 * Agrégations du tableau de bord Santé & Sécurité au travail.
 *
 * <p>Service de LECTURE seule : il ne fait qu'agréger des données déjà saisies
 * par les modules métier. Il ne produit aucune valeur estimée, extrapolée ou
 * par défaut — toute métrique sans source vaut null dans le DTO.</p>
 */
public interface DashboardService {

    /**
     * @param companyId mine active (validée/clampée par le CompanyScopeFilter) ;
     *                  null = vue consolidée toutes mines.
     * @param year      année de référence ; null = année courante.
     */
    DashboardOhsDTO getOhsDashboard(Long companyId, Integer year) throws HSException;
}
