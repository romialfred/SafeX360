package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.exception.HSException;

public interface IncidentService {
    void reportIncident(Long companyId, IncidentDTO incidentDTO) throws HSException;

    void updateIncident(Long companyId, IncidentDTO incidentDTO) throws HSException;

    List<IncidentResponse> getAllIncidents(Long companyId) throws HSException;

    IncidentDTO getIncidentById(Long companyId, Long id) throws HSException;

    IncidentResponse getIncidentResponseById(Long companyId, Long id) throws HSException;

    void updateIncidentStatus(Long companyId, Long id, IncidentStatus status) throws HSException;

    List<YearlyClosureData> getYearlyClosureData(Long companyId, int year);

    DepartmentIncidentStats getDepartmentIncidentStats(Long companyId, Long departmentId);

}
