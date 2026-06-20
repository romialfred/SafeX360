package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface OpportunityService {
    OpportunityDTO create(OpportunityDTO dto) throws HSException;

    List<OpportunityDTO> list() throws HSException;

    OpportunityDTO getById(Long id) throws HSException;

    OpportunityDTO update(OpportunityDTO dto) throws HSException;

    OpportunityDTO updateStatus(Long id, String status) throws HSException;

    void delete(Long id) throws HSException;
}
