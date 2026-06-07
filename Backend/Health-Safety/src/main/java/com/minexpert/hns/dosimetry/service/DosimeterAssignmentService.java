package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DosimeterAssignmentDTO;

public interface DosimeterAssignmentService {

    Long create(Long companyId, DosimeterAssignmentDTO dto);

    void update(Long companyId, DosimeterAssignmentDTO dto);

    List<DosimeterAssignmentDTO> getAll(Long companyId);

    DosimeterAssignmentDTO getById(Long id);

    void delete(Long id);
}
