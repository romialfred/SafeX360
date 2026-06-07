package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;

public interface ExposureAlertService {

    Long create(Long companyId, ExposureAlertDTO dto);

    void update(Long companyId, ExposureAlertDTO dto);

    List<ExposureAlertDTO> getAll(Long companyId);

    ExposureAlertDTO getById(Long id);

    void delete(Long id);
}
