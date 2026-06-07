package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DoseCumulativeDTO;

public interface DoseCumulativeService {

    Long create(Long companyId, DoseCumulativeDTO dto);

    void update(Long companyId, DoseCumulativeDTO dto);

    List<DoseCumulativeDTO> getAll(Long companyId);

    DoseCumulativeDTO getById(Long id);

    void delete(Long id);

    DoseCumulativeDTO getByWorkerAndYear(Long workerId, int year);
}
