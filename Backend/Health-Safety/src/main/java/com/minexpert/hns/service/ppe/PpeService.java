package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeService {
    PpeDTO create(PpeDTO dto) throws HSException;

    public PpeDTO update(PpeDTO dto, Long companyId) throws HSException;

    PpeDTO getById(Long id, Long companyId) throws HSException;

    List<PpeDTO> getAllStocks(Long companyId) throws HSException;

    List<PpeDTO> getActiveStocks(Long companyId) throws HSException;

    void activateStock(Long id, Long companyId) throws HSException;

    void deactivateStock(Long id, Long companyId) throws HSException;

    public Integer updateStockQuantity(Long id, Integer quantity, String operation) throws HSException;

    public List<Integer> updateStockQuantities(List<Long> ids, Integer quantity, String operation)
            throws HSException;

    List<PpeDTO> getLowStock(Long companyId) throws HSException;
}
