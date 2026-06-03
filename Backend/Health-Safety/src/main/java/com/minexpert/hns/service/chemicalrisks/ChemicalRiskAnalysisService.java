package com.minexpert.hns.service.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ChemicalRiskAnalysisService {
    ChemicalRiskAnalysisDTO create(ChemicalRiskAnalysisDTO dto) throws HSException;

    ChemicalRiskAnalysisDTO update(ChemicalRiskAnalysisDTO dto) throws HSException;

    List<ChemicalRiskAnalysisDTO> getByRiskId(Long riskId) throws HSException;

    List<ChemicalRiskAnalysisDTO> getAll() throws HSException;

    ChemicalRiskAnalysisDTO getById(Long id) throws HSException;
}
