package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamManagerDetails;
import com.hrms.DataInterface.TeamRoleDetails;
import com.hrms.dto.Timesheet.TeamManagerDTO;
import com.hrms.enums.Role;
import com.hrms.exception.HRMSException;

public interface TeamManagerService {
    public TeamManagerDTO addTeamManager(TeamManagerDTO teamManagerDTO) throws HRMSException;

    public void activateTeamManager(Long id) throws HRMSException;

    public void deactivateTeamManager(Long id) throws HRMSException;

    public List<TeamManagerDetails> getTeamManagers(Long teamId);

    public List<TeamManagerDetails> getTeamManagersWithEmail(Long teamId);

    public List<TeamManagerDetails> getActiveTeamManagers(Long teamId);

    public List<Role> getAvailableRoles(Long id) throws HRMSException;

    public List<EmployeeNameDTO> getEligibleApproverForTeam(Long companyId, Long teamId) throws HRMSException;

    public List<EmployeeNameDTO> getEligibleManagersForTeam(Long department, Long teamId)
            throws HRMSException;

    public List<TeamRoleDetails> getTeamRoleDetails(Long id);
}
