package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposedWorkerDTO;

public interface ExposedWorkerService {

    Long create(Long companyId, ExposedWorkerDTO dto);

    void update(Long companyId, ExposedWorkerDTO dto);

    List<ExposedWorkerDTO> getAll(Long companyId);

    ExposedWorkerDTO getById(Long id, Long userId, String userPermissions);

    void delete(Long id, Long userId);
}
