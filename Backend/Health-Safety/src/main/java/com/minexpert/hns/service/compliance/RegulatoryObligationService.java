package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.RegulatoryObligationDTO;
import com.minexpert.hns.exception.HSException;

public interface RegulatoryObligationService {

    Long create(RegulatoryObligationDTO dto, Long companyId) throws HSException;

    void update(RegulatoryObligationDTO dto) throws HSException;

    void activate(Long id) throws HSException;

    void deactivate(Long id) throws HSException;

    RegulatoryObligationDTO getById(Long id) throws HSException;

    List<RegulatoryObligationDTO> getAll(Long companyId) throws HSException;
}
