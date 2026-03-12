package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.InvestigationProcessDTO;
import com.minexpert.hns.exception.HSException;

public interface InvestigationProcessService {
    public Long addInvestigationProcess(InvestigationProcessDTO investigationProcessDTO) throws HSException;

    public List<InvestigationProcessDTO> getInvestigationProcessesByInvestigationId(Long investigationId)
            throws HSException;
}
