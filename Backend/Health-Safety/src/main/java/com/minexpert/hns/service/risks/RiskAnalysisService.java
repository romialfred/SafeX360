package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface RiskAnalysisService {
    RiskAnalysisDTO create(RiskAnalysisDTO dto) throws HSException;

    RiskAnalysisDTO update(RiskAnalysisDTO dto) throws HSException;

    List<RiskAnalysisDTO> getByRiskId(Long riskId) throws HSException;

    List<RiskAnalysisDTO> getAll() throws HSException;

    /**
     * Get a specific risk analysis by its ID
     */
    RiskAnalysisDTO getById(Long id) throws HSException;
}
