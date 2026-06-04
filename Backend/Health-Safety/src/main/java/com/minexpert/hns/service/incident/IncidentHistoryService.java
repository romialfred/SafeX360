package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentHistoryDTO;
import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.exception.HSException;

public interface IncidentHistoryService {
    Long saveIncidentHistory(Long companyId, IncidentHistoryDTO incidentHistoryDTO) throws HSException;

    List<IncidentHistoryDetails> getIncidentHistoryByIncidentId(Long companyId, Long incidentId) throws HSException;

}
