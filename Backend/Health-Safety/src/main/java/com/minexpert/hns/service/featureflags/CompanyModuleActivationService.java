package com.minexpert.hns.service.featureflags;

import com.minexpert.hns.dto.featureflags.CompanyModuleActivationDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;

import java.util.List;

/** Activation des modules par mine (cloisonnement tenant). */
public interface CompanyModuleActivationService {

    /** Toutes les desactivations/reactivations explicites, toutes mines confondues. */
    List<CompanyModuleActivationDTO> allOverrides();

    /**
     * Statut de CHAQUE module du catalogue pour une mine (defaut ACTIF si aucune
     * ligne). Utile a la matrice de « Gestion des Modules » et a l'IHM.
     */
    List<CompanyModuleActivationDTO> statusesForCompany(Long companyId);

    /** Cles des modules ACTIFS pour la mine (catalogue moins les desactivations). */
    List<String> activeModulesForCompany(Long companyId);

    /** Active/desactive un module pour une mine (upsert). Cle du catalogue exigee. */
    CompanyModuleActivationDTO setStatus(Long companyId, String module, Status status) throws HSException;
}
