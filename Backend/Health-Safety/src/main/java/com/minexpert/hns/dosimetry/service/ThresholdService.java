package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ThresholdDTO;

public interface ThresholdService {

    Long create(Long companyId, ThresholdDTO dto);

    void update(Long companyId, ThresholdDTO dto);

    List<ThresholdDTO> getAll(Long companyId);

    List<ThresholdDTO> getGlobalDefaults();

    ThresholdDTO getById(Long companyId, Long id);

    void delete(Long companyId, Long id);
}
