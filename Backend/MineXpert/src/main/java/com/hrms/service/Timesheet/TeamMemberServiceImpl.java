package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.TeamMemberDetails;
import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.TeamMemberDTO;
import com.hrms.entity.Timesheet.Team;
import com.hrms.entity.Timesheet.TeamMember;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.MemberEntryRepository;
import com.hrms.repository.Timesheet.TeamMemberRepository;
import com.hrms.repository.Timesheet.TeamRepository;
import com.hrms.utility.TimesheetUtitlity;

@Service
public class TeamMemberServiceImpl implements TeamMemberService {

    @Autowired
    private TeamMemberRepository teamMemberRepository;
    @Autowired
    private MemberEntryService memberEntryService;

    @Autowired
    private MemberEntryRepository memberEntryRepository;
    @Autowired
    private ConstraintsService constraintsService;

    @Autowired
    private TeamRepository teamRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMembersByTeam", key = "#teamMemberDTO.team.id", condition = "#teamMemberDTO.team != null && #teamMemberDTO.team.id != null"),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public TeamMemberDTO addTeamMember(TeamMemberDTO teamMemberDTO) throws HRMSException {

        if (!constraintsService.isFlagActive("ADD_MEMBER_MID_WEEK")) {
            Team team = teamRepository.findById(teamMemberDTO.getTeam().getId())
                    .orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
            if (!TimesheetUtitlity.getDayOfWeek(LocalDate.now()).equals(team.getWeekStartDay())) {
                throw new HRMSException("TEAM_MEMBER_CREATION_NOT_ALLOWED_MID_WEEK");

            }
        }
        teamMemberDTO.setStatus(Status.ACTIVE);
        Optional<Long> teamMemberId = teamMemberRepository.findTeamMemberId(teamMemberDTO.getTeam().getId(),
                teamMemberDTO.getEmployee().getId());
        if (teamMemberId.isPresent()) {
            throw new HRMSException("TEAM_MEMBER_ALREADY_EXISTS");
        }
        Optional<Long> activeTeamMemberId = teamMemberRepository
                .findActiveTeamMemberId(teamMemberDTO.getEmployee().getId());
        if (activeTeamMemberId.isPresent()) {
            throw new HRMSException("TEAM_MEMBER_ACTIVE_IN_ANOTHER_TEAM");
        }
        TeamMemberDTO tm = teamMemberRepository.save(teamMemberDTO.toEntity()).toDTO();
        memberEntryService.createEntryforAddedMember(teamMemberDTO.getTeam().getId(), tm.getId(),
                teamMemberDTO.getEmployee().getId(), tm.getShift());
        return tm;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void activateTeamMember(Long id) throws HRMSException {

        TeamMember tm = teamMemberRepository.findById(id).orElseThrow(() -> new HRMSException("TEAM_MEMBER_NOT_FOUND"));
        if (!constraintsService.isFlagActive("ADD_MEMBER_MID_WEEK")) {
            Team team = teamRepository.findById(tm.getTeam().getId())
                    .orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
            if (!TimesheetUtitlity.getDayOfWeek(LocalDate.now()).equals(team.getWeekStartDay())) {
                throw new HRMSException("TEAM_MEMBER_CREATION_NOT_ALLOWED_MID_WEEK");

            }
        }
        Optional<Long> activeTeamMemberId = teamMemberRepository
                .findActiveTeamMemberId(tm.getEmployee().getId());
        if (activeTeamMemberId.isPresent()) {
            throw new HRMSException("TEAM_MEMBER_ACTIVE_IN_ANOTHER_TEAM");
        }
        tm.setStatus(Status.ACTIVE);
        memberEntryService.createEntryforAddedMember(tm.getTeam().getId(), tm.getId(),
                tm.getEmployee().getId(), tm.getShift());
        teamMemberRepository.save(tm);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void deactivateTeamMember(Long id) throws HRMSException {
        TeamMember tm = teamMemberRepository.findById(id).orElseThrow(() -> new HRMSException("TEAM_MEMBER_NOT_FOUND"));
        tm.setStatus(Status.INACTIVE);
        teamMemberRepository.save(tm);
        memberEntryRepository.deleteByDateGreaterThanEqualAndEmployeeId(LocalDate.now(), tm.getEmployee().getId());
    }

    @Override
    @Cacheable(cacheNames = "teamMembersByTeam", key = "#teamId")
    public List<TeamMemberDetails> getTeamMembers(Long teamId) throws HRMSException {
        return teamMemberRepository.findByTeamId(teamId);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "eligibleEmployeesForTeam", allEntries = true)
    })
    public void updateTeamMember(TeamMemberDTO teamMemberDTO) throws HRMSException {
        TeamMember tm = teamMemberRepository.findById(teamMemberDTO.getId())
                .orElseThrow(() -> new HRMSException("TEAM_MEMBER_NOT_FOUND"));
        tm.setShift(teamMemberDTO.getShift());
        teamMemberRepository.save(tm);
    }

}
