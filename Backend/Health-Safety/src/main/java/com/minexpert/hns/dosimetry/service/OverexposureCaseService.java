package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.OverexposureCaseDTO;

public interface OverexposureCaseService {

    Long create(Long companyId, OverexposureCaseDTO dto);

    void update(Long companyId, OverexposureCaseDTO dto);

    List<OverexposureCaseDTO> getAll(Long companyId);

    OverexposureCaseDTO getById(Long id);

    void delete(Long id);
}
