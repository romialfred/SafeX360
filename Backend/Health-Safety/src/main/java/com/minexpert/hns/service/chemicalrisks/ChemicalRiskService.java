package com.minexpert.hns.service.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ChemicalRiskService {
    ChemicalRiskDTO create(ChemicalRiskDTO dto) throws HSException;

    ChemicalRiskDTO update(ChemicalRiskDTO dto) throws HSException;

    ChemicalRiskDTO updateStatus(Long id, String status) throws HSException;

    ChemicalRiskDTO getById(Long id) throws HSException;

    List<ChemicalRiskDTO> getAll() throws HSException;
}
