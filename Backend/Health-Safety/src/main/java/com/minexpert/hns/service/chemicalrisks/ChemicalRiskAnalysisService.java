package com.minexpert.hns.service.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ChemicalRiskAnalysisService {
    ChemicalRiskAnalysisDTO create(ChemicalRiskAnalysisDTO dto, Long companyId) throws HSException;

    ChemicalRiskAnalysisDTO update(ChemicalRiskAnalysisDTO dto, Long companyId) throws HSException;

    List<ChemicalRiskAnalysisDTO> getByRiskId(Long riskId, Long companyId) throws HSException;

    List<ChemicalRiskAnalysisDTO> getAll(Long companyId) throws HSException;

    ChemicalRiskAnalysisDTO getById(Long id, Long companyId) throws HSException;
}
