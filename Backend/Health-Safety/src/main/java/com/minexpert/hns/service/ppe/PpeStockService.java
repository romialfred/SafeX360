package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeStockDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeStockService {
    PpeStockDTO create(PpeStockDTO dto) throws HSException;

    public PpeStockDTO update(PpeStockDTO dto) throws HSException;

    PpeStockDTO getById(Long id) throws HSException;

    List<PpeStockDTO> getAllStocks() throws HSException;

    List<PpeStockDTO> getByPpeId(Long ppeId) throws HSException;
}
