package com.minexpert.hns.service.indicator;

import com.minexpert.hns.dto.indicator.IndicatorPlanDTO;
import com.minexpert.hns.exception.HSException;

public interface IndicatorPlanService {

    /**
     * Retourne le plan (companyId, indicatorId, year). S'il n'existe pas encore,
     * renvoie un squelette non persiste (id=null) avec les periodes generees
     * selon la frequence de l'indicateur. Toujours enrichi des meta indicateur.
     */
    IndicatorPlanDTO getPlan(Long companyId, Long indicatorId, Integer year) throws HSException;

    /** Cree ou met a jour le plan et remplace ses periodes (upsert). Renvoie le plan recalcule. */
    IndicatorPlanDTO savePlan(Long companyId, IndicatorPlanDTO dto) throws HSException;
}
