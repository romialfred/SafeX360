package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.MedicalSurveillanceDTO;

public interface MedicalSurveillanceService {

    Long create(Long companyId, MedicalSurveillanceDTO dto, Long userId);

    void update(Long companyId, MedicalSurveillanceDTO dto, Long userId);

    List<MedicalSurveillanceDTO> getAll(Long companyId, Long userId);

    MedicalSurveillanceDTO getById(Long id, Long userId);

    void delete(Long id, Long userId);
}
