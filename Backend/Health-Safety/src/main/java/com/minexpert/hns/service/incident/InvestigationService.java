package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.InvestActionDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.exception.HSException;

public interface InvestigationService {

    public Long addInvestigation(InvestActionDTO request) throws HSException;

    public void updateInvestigation(InvestActionDTO request) throws HSException;

    public InvestResponse getInvestigationByIncidentId(Long incidentId) throws HSException;

    public List<InvestigationSummary> getAllInvestigations() throws HSException;

    public InvestResponse getInvestigationById(Long id) throws HSException;
}
