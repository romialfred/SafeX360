package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.exception.HSException;

public interface TeamMemberService {
    public Long addTeamMember(TeamMemberDTO teamMemberDTO) throws HSException;

    public void updateTeamMember(TeamMemberDTO teamMemberDTO) throws HSException;

    public void updateOrAddMember(TeamMemberDTO teamMemberDTO) throws HSException;

    public void deleteTeamMember(Long id);

    public TeamMemberDTO getTeamMemberById(Long id) throws HSException;

    public List<TeamMemberDTO> getAllTeamMembers() throws HSException;

    public List<TeamMemberDTO> getAllActiveTeamMembers() throws HSException;

    public List<TeamMemberDTO> getTeamMemberByTeam(Long teamId) throws HSException;

    public void activateTeamMember(Long id) throws HSException;

    public void deactivateTeamMember(Long id) throws HSException;

    public TeamMemberDTO getTeamMemberByEmployeeId(Long employeeId) throws HSException;

    public com.minexpert.hns.dto.parameters.TeamResponse getActiveTeamDetailsByEmployeeId(Long employeeId)
            throws HSException;
}
