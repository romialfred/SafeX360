package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.WorkAuthorizationDTO;
import com.minexpert.hns.exception.HSException;

public interface WorkAuthorizationService {

    Long create(WorkAuthorizationDTO dto, Long companyId) throws HSException;

    void update(WorkAuthorizationDTO dto) throws HSException;

    void close(Long id) throws HSException;

    void reopen(Long id) throws HSException;

    WorkAuthorizationDTO getById(Long id) throws HSException;

    List<WorkAuthorizationDTO> getAll(Long companyId) throws HSException;
}
