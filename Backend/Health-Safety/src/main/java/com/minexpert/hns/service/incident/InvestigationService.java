package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.InvestActionDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.exception.HSException;

public interface InvestigationService {

    public Long addInvestigation(Long companyId, InvestActionDTO request) throws HSException;

    public void updateInvestigation(Long companyId, InvestActionDTO request) throws HSException;

    public InvestResponse getInvestigationByIncidentId(Long companyId, Long incidentId) throws HSException;

    public List<InvestigationSummary> getAllInvestigations(Long companyId) throws HSException;

    public InvestResponse getInvestigationById(Long companyId, Long id) throws HSException;
}
