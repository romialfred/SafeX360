package com.hrms.service.Timesheet;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamManagerDetails;
import com.hrms.DataInterface.TeamRoleDetails;
import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.TeamManagerDTO;
import com.hrms.entity.Timesheet.TeamManager;
import com.hrms.enums.Role;
import com.hrms.exception.HRMSException;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.Timesheet.TeamManagerRepository;

@Service
public class TeamManagerServiceImpl implements TeamManagerService {

    @Autowired
    private TeamManagerRepository teamManagerRepository;
    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public TeamManagerDTO addTeamManager(TeamManagerDTO teamManagerDTO) throws HRMSException {
        teamManagerDTO.setStatus(Status.ACTIVE);
        Optional<Long> teamManagerId = teamManagerRepository.findTeamManagerId(teamManagerDTO.getTeam().getId(),
                teamManagerDTO.getEmployee().getId());
        if (teamManagerId.isPresent()) {
            throw new HRMSException("TEAM_MANAGER_ALREADY_EXISTS");
        }
        Optional<Long> activeTeamManagerId = teamManagerRepository
                .findActiveTeamManagerId(teamManagerDTO.getTeam().getId(), teamManagerDTO.getRole());
        if (activeTeamManagerId.isPresent()) {
            throw new HRMSException("ROLE_ACTIVE_IN_TEAM");
        }
        return teamManagerRepository.save(teamManagerDTO.toEntity()).toDTO();
    }

    @Override
    public List<TeamManagerDetails> getTeamManagers(Long teamId) {
        return teamManagerRepository.findByTeamId(teamId);
    }

    @Override
    public List<Role> getAvailableRoles(Long id) throws HRMSException {
        List<Role> roles = teamManagerRepository.findAvailableRoles(id);
        return Arrays.asList(Role.values()).stream().filter(r -> r != Role.MEMBER && !roles.contains(r)).toList();
    }

    @Override
    public void activateTeamManager(Long id) throws HRMSException {
        TeamManager tm = teamManagerRepository.findById(id)
                .orElseThrow(() -> new HRMSException("TEAM_MANAGER_NOT_FOUND"));
        Optional<Long> activeTeamManagerId = teamManagerRepository
                .findActiveTeamManagerId(tm.getTeam().getId(), tm.getRole());
        if (activeTeamManagerId.isPresent()) {
            throw new HRMSException("ROLE_ACTIVE_IN_TEAM");
        }
        tm.setStatus(Status.ACTIVE);
        teamManagerRepository.save(tm);

    }

    @Override
    public void deactivateTeamManager(Long id) throws HRMSException {
        TeamManager tm = teamManagerRepository.findById(id)
                .orElseThrow(() -> new HRMSException("TEAM_MANAGER_NOT_FOUND"));
        tm.setStatus(Status.INACTIVE);
        teamManagerRepository.save(tm);
    }

    @Override
    public List<EmployeeNameDTO> getEligibleApproverForTeam(Long companyId, Long teamId) throws HRMSException {
        List<Long> employeeIds = teamManagerRepository.findAllEmployeeIds(teamId);
        return employeeRepository.findEmployeeNamesByCompanyIdAndNotInAnyTeam(companyId, employeeIds);
    }

    @Override
    public List<EmployeeNameDTO> getEligibleManagersForTeam(Long departmentId, Long teamId) throws HRMSException {
        List<Long> employeeIds = teamManagerRepository.findAllEmployeeIds(teamId);
        return employeeRepository.findEmployeeNamesByDepartmentIdAndNotInAnyTeam(departmentId, employeeIds);
    }

    @Override
    public List<TeamManagerDetails> getActiveTeamManagers(Long teamId) {
        return teamManagerRepository.findActiveByTeamId(teamId);
    }

    @Override
    public List<TeamRoleDetails> getTeamRoleDetails(Long id) {
        return teamManagerRepository.findTeamRoleDetails(id);
    }

    @Override
    public List<TeamManagerDetails> getTeamManagersWithEmail(Long teamId) {
        List<TeamManagerDetails> details = teamManagerRepository.findByTeamIdWithEmail(teamId);

        return details;
    }

}
