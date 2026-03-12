package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.IncidentTeamDTO;
import com.minexpert.hns.dto.parameters.TeamRequest;
import com.minexpert.hns.dto.parameters.TeamResponse;
import com.minexpert.hns.exception.HSException;

public interface IncidentTeamService {
    public void addIncidentTeam(TeamRequest teamRequest) throws HSException;

    public void updateIncidentTeam(TeamRequest teamRequest) throws HSException;

    public void deleteIncidentTeam(Long id);

    public IncidentTeamDTO getIncidentTeamById(Long id) throws HSException;

    public List<IncidentTeamDTO> getAllIncidentTeams() throws HSException;

    public List<IncidentTeamDTO> getAllActiveIncidentTeams() throws HSException;

    public void activateIncidentTeam(Long id) throws HSException;

    public void deactivateIncidentTeam(Long id) throws HSException;

    public TeamResponse getTeamDetailsById(Long id) throws HSException;

}
