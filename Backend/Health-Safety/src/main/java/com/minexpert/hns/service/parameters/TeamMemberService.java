package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.exception.HSException;

public interface TeamMemberService {
    public Long addTeamMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException;

    public void updateTeamMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException;

    public void updateOrAddMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException;

    public void deleteTeamMember(Long companyId, Long id) throws HSException;

    public TeamMemberDTO getTeamMemberById(Long companyId, Long id) throws HSException;

    public List<TeamMemberDTO> getAllTeamMembers(Long companyId) throws HSException;

    public List<TeamMemberDTO> getAllActiveTeamMembers(Long companyId) throws HSException;

    public List<TeamMemberDTO> getTeamMemberByTeam(Long companyId, Long teamId) throws HSException;

    public void activateTeamMember(Long companyId, Long id) throws HSException;

    public void deactivateTeamMember(Long companyId, Long id) throws HSException;

    public TeamMemberDTO getTeamMemberByEmployeeId(Long companyId, Long employeeId) throws HSException;

    public com.minexpert.hns.dto.parameters.TeamResponse getActiveTeamDetailsByEmployeeId(Long companyId,
            Long employeeId)
            throws HSException;
}
