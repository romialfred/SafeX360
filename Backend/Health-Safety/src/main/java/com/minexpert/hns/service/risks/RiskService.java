package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.exception.HSException;

import java.time.LocalDate;
import java.util.List;

public interface RiskService {
    RiskDTO create(RiskDTO dto) throws HSException;

    public RiskDTO update(RiskDTO dto, Long companyId) throws HSException;

    RiskDTO updateStatus(Long id, String status, Long companyId) throws HSException;

    RiskDTO getById(Long id, Long companyId) throws HSException;

    List<RiskDTO> getAll(Long companyId) throws HSException;

    List<RiskDTO> getAllWithRiskLevel(Long companyId) throws HSException;

    List<RiskDTO> search(String status, Long departmentId, Long ownerId, LocalDate from, LocalDate to, String q,
            Long companyId) throws HSException;

    RiskOverviewResponse getOverview(String status, Long departmentId, Long ownerId, LocalDate from, LocalDate to,
            String q, Long companyId) throws HSException;
}
