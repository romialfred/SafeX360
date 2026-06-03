package com.hrms.service.Timesheet;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamDetails;
import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.TeamDTO;
import com.hrms.entity.Timesheet.Team;
import com.hrms.entity.Timesheet.TeamManager;
import com.hrms.entity.Timesheet.TeamMember;
import com.hrms.enums.TeamStatus;
import com.hrms.exception.HRMSException;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.Timesheet.TeamManagerRepository;
import com.hrms.repository.Timesheet.TeamMemberRepository;
import com.hrms.repository.Timesheet.TeamRepository;

@Service

public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;
    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TeamManagerRepository teamManagerRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamDetailsById", allEntries = true),
            @CacheEvict(cacheNames = "teamsAll", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void createTeam(TeamDTO teamDTO) throws HRMSException {
        teamDTO.setStatus(TeamStatus.ACTIVE);
        List<TeamMember> teamMembers = teamDTO.getTeamMembers().stream().map(tm -> tm.toEntity())
                .collect(Collectors.toList());
        teamDTO.setTeamMembers(null);
        List<TeamManager> teamManagers = teamDTO.getTeamManagers().stream().map(tm -> tm.toEntity())
                .collect(Collectors.toList());
        teamDTO.setTeamManagers(null);
        teamDTO.setRemainingWorkingDays(0);
        teamDTO.setRemainingRestDays(0);
        Long id = teamRepository.save(teamDTO.toEntity()).getId();
        teamMembers.forEach(tm -> {
            Team team = new Team();
            team.setId(id);
            tm.setTeam(team);
            tm.setStatus(Status.ACTIVE);
            teamMemberRepository.save(tm);
        });

        teamManagers.forEach(tm -> {
            Team team = new Team();
            team.setId(id);
            tm.setTeam(team);
            tm.setStatus(Status.ACTIVE);
            teamManagerRepository.save(tm);
        });

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamDetailsById", key = "#teamDTO.id", condition = "#teamDTO.id != null"),
            @CacheEvict(cacheNames = "teamsAll", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void updateTeam(TeamDTO teamDTO) throws HRMSException {
        Team team = teamRepository.findById(teamDTO.getId()).orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
        team.setName(teamDTO.getName());
        team.setShortName(teamDTO.getShortName());
        team.setDescription(teamDTO.getDescription());
        team.setWeekStartDay(teamDTO.getWeekStartDay());
        team.setType(teamDTO.getType());
        team.setWorkingHours(teamDTO.getWorkingHours());
        team.setMaxWorkingHours(teamDTO.getMaxWorkingHours());
        team.setColor(teamDTO.getColor());
        if (!teamDTO.getRotation().equals(team.getRotation())) {
            team.setRotation(teamDTO.getRotation());
            team.setRemainingRestDays(0);
            team.setRemainingWorkingDays(0);
        }
        teamRepository.save(team);
    }

    @Override
    @Cacheable(cacheNames = "teamDetailsById", key = "#id")
    public TeamDetails getTeam(Long id) throws HRMSException {
        return teamRepository.findTeamDetailsById(id).orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = "teamsAll")
    public List<TeamDetails> getAllTeams() throws HRMSException {
        return teamRepository.findAllTeamDetails();
    }

    @Override
    @Cacheable(cacheNames = "eligibleEmployeesForTeam", key = "{#departmentId, #teamId}")
    public List<EmployeeNameDTO> getEligibleEmployeesForTeam(Long departmentId, Long teamId) throws HRMSException {
        List<Long> empIds = teamMemberRepository.findActiveEmployeeIds(teamId);
        return employeeRepository.findEmployeeNamesByDepartmentIdAndNotInAnyTeam(departmentId, empIds);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamDetailsById", key = "#id"),
            @CacheEvict(cacheNames = "teamsAll", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void deleteTeam(Long id) throws HRMSException {
        Team team = teamRepository.findById(id).orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
        team.setStatus(TeamStatus.INACTIVE);
        teamRepository.save(team);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamDetailsById", key = "#id"),
            @CacheEvict(cacheNames = "teamsAll", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void activateTeam(Long id) throws HRMSException {
        Team team = teamRepository.findById(id).orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
        team.setStatus(TeamStatus.ACTIVE);
        teamRepository.save(team);
    }

}
