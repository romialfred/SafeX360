package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface RiskAnalysisService {
    RiskAnalysisDTO create(RiskAnalysisDTO dto, Long companyId) throws HSException;

    RiskAnalysisDTO update(RiskAnalysisDTO dto, Long companyId) throws HSException;

    List<RiskAnalysisDTO> getByRiskId(Long riskId, Long companyId) throws HSException;

    List<RiskAnalysisDTO> getAll(Long companyId) throws HSException;

    /**
     * Get a specific risk analysis by its ID
     */
    RiskAnalysisDTO getById(Long id, Long companyId) throws HSException;
}
