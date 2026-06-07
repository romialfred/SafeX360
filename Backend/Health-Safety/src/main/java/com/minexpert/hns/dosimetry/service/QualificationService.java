package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.QualificationDTO;

public interface QualificationService {

    Long create(Long companyId, QualificationDTO dto);

    void update(Long companyId, QualificationDTO dto);

    List<QualificationDTO> getAll(Long companyId);

    QualificationDTO getById(Long id);

    void delete(Long id);
}
