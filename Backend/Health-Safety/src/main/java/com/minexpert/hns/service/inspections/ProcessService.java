package com.minexpert.hns.service.inspections;

import com.minexpert.hns.dto.inspections.ProcessDTO;
import com.minexpert.hns.exception.HSException;

public interface ProcessService {
    ProcessDTO saveDraftProcess(ProcessDTO processDTO) throws HSException;

    ProcessDTO getDraftProcess(Long id, Long companyId) throws HSException;
}
