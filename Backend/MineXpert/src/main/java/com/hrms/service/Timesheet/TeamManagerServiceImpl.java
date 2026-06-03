package com.hrms.service.Timesheet;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamManagersByTeam", key = "#teamManagerDTO.team.id", condition = "#teamManagerDTO.team != null && #teamManagerDTO.team.id != null"),
            @CacheEvict(cacheNames = "availableTeamRoles", key = "#teamManagerDTO.team.id", condition = "#teamManagerDTO.team != null && #teamManagerDTO.team.id != null"),
            @CacheEvict(cacheNames = "eligibleApproversForTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleManagersForTeam", allEntries = true),
            @CacheEvict(cacheNames = "activeTeamManagers", allEntries = true),
            @CacheEvict(cacheNames = "teamRoleDetails", key = "#teamManagerDTO.team.id", condition = "#teamManagerDTO.team != null && #teamManagerDTO.team.id != null"),
            @CacheEvict(cacheNames = "teamManagersWithEmail", key = "#teamManagerDTO.team.id", condition = "#teamManagerDTO.team != null && #teamManagerDTO.team.id != null")
    })
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
    @Cacheable(cacheNames = "teamManagersByTeam", key = "#teamId")
    public List<TeamManagerDetails> getTeamManagers(Long teamId) {
        return teamManagerRepository.findByTeamId(teamId);
    }

    @Override
    @Cacheable(cacheNames = "availableTeamRoles", key = "#id")
    public List<Role> getAvailableRoles(Long id) throws HRMSException {
        List<Role> roles = teamManagerRepository.findAvailableRoles(id);
        return Arrays.asList(Role.values()).stream().filter(r -> r != Role.MEMBER && !roles.contains(r)).toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamManagersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "availableTeamRoles", key = "#id"),
            @CacheEvict(cacheNames = "eligibleApproversForTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleManagersForTeam", allEntries = true),
            @CacheEvict(cacheNames = "activeTeamManagers", allEntries = true),
            @CacheEvict(cacheNames = "teamRoleDetails", allEntries = true),
            @CacheEvict(cacheNames = "teamManagersWithEmail", allEntries = true)
    })
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamManagersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "availableTeamRoles", allEntries = true),
            @CacheEvict(cacheNames = "eligibleApproversForTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleManagersForTeam", allEntries = true),
            @CacheEvict(cacheNames = "activeTeamManagers", allEntries = true),
            @CacheEvict(cacheNames = "teamRoleDetails", allEntries = true),
            @CacheEvict(cacheNames = "teamManagersWithEmail", allEntries = true)
    })
    public void deactivateTeamManager(Long id) throws HRMSException {
        TeamManager tm = teamManagerRepository.findById(id)
                .orElseThrow(() -> new HRMSException("TEAM_MANAGER_NOT_FOUND"));
        tm.setStatus(Status.INACTIVE);
        teamManagerRepository.save(tm);
    }

    @Override
    @Cacheable(cacheNames = "eligibleApproversForTeam", key = "{#companyId, #teamId}")
    public List<EmployeeNameDTO> getEligibleApproverForTeam(Long companyId, Long teamId) throws HRMSException {
        List<Long> employeeIds = teamManagerRepository.findAllEmployeeIds(teamId);
        return employeeRepository.findEmployeeNamesByCompanyIdAndNotInAnyTeam(companyId, employeeIds);
    }

    @Override
    @Cacheable(cacheNames = "eligibleManagersForTeam", key = "{#departmentId, #teamId}")
    public List<EmployeeNameDTO> getEligibleManagersForTeam(Long departmentId, Long teamId) throws HRMSException {
        List<Long> employeeIds = teamManagerRepository.findAllEmployeeIds(teamId);
        return employeeRepository.findEmployeeNamesByDepartmentIdAndNotInAnyTeam(departmentId, employeeIds);
    }

    @Override
    @Cacheable(cacheNames = "activeTeamManagers", key = "#teamId")
    public List<TeamManagerDetails> getActiveTeamManagers(Long teamId) {
        return teamManagerRepository.findActiveByTeamId(teamId);
    }

    @Override
    @Cacheable(cacheNames = "teamRoleDetails", key = "#id")
    public List<TeamRoleDetails> getTeamRoleDetails(Long id) {
        return teamManagerRepository.findTeamRoleDetails(id);
    }

    @Override
    @Cacheable(cacheNames = "teamManagersWithEmail", key = "#teamId")
    public List<TeamManagerDetails> getTeamManagersWithEmail(Long teamId) {
        List<TeamManagerDetails> details = teamManagerRepository.findByTeamIdWithEmail(teamId);

        return details;
    }

}
