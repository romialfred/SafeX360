package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentTeamDTO;
import com.minexpert.hns.dto.parameters.TeamRequest;
import com.minexpert.hns.dto.parameters.TeamResponse;
import com.minexpert.hns.exception.HSException;

public interface IncidentTeamService {
    public void addIncidentTeam(Long companyId, TeamRequest teamRequest) throws HSException;

    public void updateIncidentTeam(Long companyId, TeamRequest teamRequest) throws HSException;

    public void deleteIncidentTeam(Long companyId, Long id) throws HSException;

    public IncidentTeamDTO getIncidentTeamById(Long companyId, Long id) throws HSException;

    public List<IncidentTeamDTO> getAllIncidentTeams(Long companyId) throws HSException;

    public List<IncidentTeamDTO> getAllActiveIncidentTeams(Long companyId) throws HSException;

    public void activateIncidentTeam(Long companyId, Long id) throws HSException;

    public void deactivateIncidentTeam(Long companyId, Long id) throws HSException;

    public TeamResponse getTeamDetailsById(Long companyId, Long id) throws HSException;

}
