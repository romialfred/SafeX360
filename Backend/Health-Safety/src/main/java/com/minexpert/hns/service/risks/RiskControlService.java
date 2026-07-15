package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskControlDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface RiskControlService {
    RiskControlDTO create(RiskControlDTO dto) throws HSException;

    List<RiskControlDTO> listByRisk(String sourceType, Long riskId, Long companyId) throws HSException;

    RiskControlDTO update(RiskControlDTO dto, Long companyId) throws HSException;

    void delete(Long id, Long companyId) throws HSException;
}
