package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentHistoryDTO;
import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.exception.HSException;

public interface IncidentHistoryService {
    public Long saveIncidentHistory(IncidentHistoryDTO incidentHistoryDTO) throws HSException;

    public List<IncidentHistoryDetails> getIncidentHistoryByIncidentId(Long incidentId) throws HSException;

}
