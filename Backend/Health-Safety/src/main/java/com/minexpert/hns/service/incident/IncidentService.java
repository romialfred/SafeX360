package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.exception.HSException;

public interface IncidentService {
    public void reportIncident(IncidentDTO incidentDTO) throws HSException;

    public void updateIncident(IncidentDTO incidentDTO) throws HSException;

    public List<IncidentResponse> getAllIncidents() throws HSException;

    public IncidentDTO getIncidentById(Long id) throws HSException;

    public IncidentResponse getIncidentResponseById(Long id) throws HSException;

    public void updateIncidentStatus(Long id, IncidentStatus status) throws HSException;

    List<YearlyClosureData> getYearlyClosureData(int year);

    DepartmentIncidentStats getDepartmentIncidentStats(Long departmentId);

}
