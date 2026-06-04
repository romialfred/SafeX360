package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.exception.HSException;

import java.time.LocalDate;
import java.util.List;

public interface RiskService {
    RiskDTO create(RiskDTO dto) throws HSException;

    public RiskDTO update(RiskDTO dto) throws HSException;

    RiskDTO updateStatus(Long id, String status) throws HSException;

    RiskDTO getById(Long id) throws HSException;

    List<RiskDTO> getAll() throws HSException;

    List<RiskDTO> getAllWithRiskLevel() throws HSException;

    List<RiskDTO> search(String status, Long departmentId, Long ownerId, LocalDate from, LocalDate to, String q)
            throws HSException;

    RiskOverviewResponse getOverview(String status, Long departmentId, Long ownerId, LocalDate from, LocalDate to,
            String q) throws HSException;
}
