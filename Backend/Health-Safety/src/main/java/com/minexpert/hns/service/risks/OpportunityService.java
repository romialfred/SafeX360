package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface OpportunityService {
    OpportunityDTO create(OpportunityDTO dto) throws HSException;

    List<OpportunityDTO> list(Long companyId) throws HSException;

    OpportunityDTO getById(Long id, Long companyId) throws HSException;

    OpportunityDTO update(OpportunityDTO dto, Long companyId) throws HSException;

    OpportunityDTO updateStatus(Long id, String status, Long companyId) throws HSException;

    void delete(Long id, Long companyId) throws HSException;
}
