package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamDetails;
import com.hrms.dto.Timesheet.TeamDTO;
import com.hrms.exception.HRMSException;

public interface TeamService {

    public void createTeam(TeamDTO teamDTO) throws HRMSException;

    public void updateTeam(TeamDTO teamDTO) throws HRMSException;

    public TeamDetails getTeam(Long id) throws HRMSException;

    public List<TeamDetails> getAllTeams() throws HRMSException;

    public List<EmployeeNameDTO> getEligibleEmployeesForTeam(Long departmentId, Long teamId) throws HRMSException;

    public void deleteTeam(Long id) throws HRMSException;

    public void activateTeam(Long id) throws HRMSException;

}
