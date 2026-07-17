package com.minexpert.hns.service.indicator;

import java.util.List;

import com.minexpert.hns.dto.indicator.HsIndicatorDTO;
import com.minexpert.hns.exception.HSException;

public interface HsIndicatorService {

    Long createIndicator(Long companyId, HsIndicatorDTO dto) throws HSException;

    void updateIndicator(Long companyId, HsIndicatorDTO dto) throws HSException;

    List<HsIndicatorDTO> getAllIndicators(Long companyId) throws HSException;

    /** Indicateurs actifs planifiables (hasForecast=true), pour l'onglet Planification. */
    List<HsIndicatorDTO> getForecastableIndicators(Long companyId) throws HSException;

    HsIndicatorDTO getIndicatorById(Long companyId, Long id) throws HSException;

    /** Desactivation logique (active=false), avec garde d'appartenance. */
    void deleteIndicator(Long companyId, Long id) throws HSException;
}
