package com.minexpert.hns.service.nonConformity;

import com.minexpert.hns.dto.nonConformity.EventAnalysisDTO;
import com.minexpert.hns.exception.HSException;

public interface EventAnalysisService {

    public Long createEventAnalysis(EventAnalysisDTO eventAnalysisDTO) throws HSException;

    public EventAnalysisDTO getEventAnalysisByNonConformityId(Long nonConformityId, Long companyId) throws HSException;

    public void updateEventAnalysis(EventAnalysisDTO eventAnalysisDTO) throws HSException;

}
