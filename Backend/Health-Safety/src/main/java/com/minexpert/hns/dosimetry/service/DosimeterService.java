package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DosimeterDTO;

public interface DosimeterService {

    Long create(Long companyId, DosimeterDTO dto);

    void update(Long companyId, DosimeterDTO dto);

    List<DosimeterDTO> getAll(Long companyId);

    DosimeterDTO getById(Long id);

    void delete(Long id);
}
