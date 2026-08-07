package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.MandatoryInspectionDTO;
import com.minexpert.hns.exception.HSException;

public interface MandatoryInspectionService {

    Long create(MandatoryInspectionDTO dto, Long companyId) throws HSException;

    void update(MandatoryInspectionDTO dto) throws HSException;

    void activate(Long id) throws HSException;

    void deactivate(Long id) throws HSException;

    MandatoryInspectionDTO getById(Long id) throws HSException;

    List<MandatoryInspectionDTO> getAll(Long companyId) throws HSException;
}
