package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposureProfileDTO;

public interface ExposureProfileService {

    Long create(Long companyId, ExposureProfileDTO dto);

    void update(Long companyId, ExposureProfileDTO dto);

    List<ExposureProfileDTO> getAll(Long companyId);

    ExposureProfileDTO getById(Long id);

    void delete(Long id);

    List<ExposureProfileDTO> getByWorkerId(Long workerId);
}
