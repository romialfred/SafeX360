package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.dto.parameters.TeamResponse;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.parameters.TeamMember;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.TeamMemberRepository;

@Service
@Transactional

public class TeamMemberServiceImpl implements TeamMemberService {

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private HrmsClient hrmsClient;

    @Override
    public Long addTeamMember(TeamMemberDTO teamMemberDTO) throws HSException {
        Optional<TeamMember> opt = teamMemberRepository.findByEmployeeId(teamMemberDTO.getEmployeeId());
        if (opt.isPresent()) {
            throw new HSException("TEAM_MEMBER_ALREADY_EXISTS");
        }
        teamMemberDTO.setStatus(Status.ACTIVE);
        teamMemberDTO.setCreatedAt(LocalDateTime.now());
        teamMemberDTO.setUpdatedAt(LocalDateTime.now());
        return teamMemberRepository.save(teamMemberDTO.toEntity()).getId();
    }

    @Override
    public void updateTeamMember(TeamMemberDTO teamMemberDTO) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(teamMemberDTO.getId())
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        teamMember.setNotificationLevel(teamMemberDTO.getNotificationLevel().toString());
        teamMember.setRole(teamMemberDTO.getRole());
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    public void updateOrAddMember(TeamMemberDTO teamMemberDTO) throws HSException {
        Optional<TeamMember> opt = teamMemberRepository.findByEmployeeId(teamMemberDTO.getEmployeeId());
        if (opt.isPresent()) {
            TeamMember teamMember = opt.get();
            teamMember.setNotificationLevel(teamMemberDTO.getNotificationLevel().toString());
            teamMember.setRole(teamMemberDTO.getRole());
            teamMember.setUpdatedAt(LocalDateTime.now());
            teamMemberRepository.save(teamMember);
        } else {
            addTeamMember(teamMemberDTO);
        }
    }

    @Override
    public void deleteTeamMember(Long id) {
        teamMemberRepository.deleteById(id);
    }

    @Override
    public TeamMemberDTO getTeamMemberById(Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        return teamMember.toDTO();
    }

    @Override
    public List<TeamMemberDTO> getAllTeamMembers() throws HSException {
        List<TeamMemberDTO> teamMembers = ((List<TeamMember>) teamMemberRepository.findAll()).stream()
                .map(TeamMember::toDTO).toList();
        List<Long> empIds = teamMembers.stream()
                .map(TeamMemberDTO::getEmployeeId)
                .toList();

        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> employeeNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        teamMembers.forEach(member -> {
            String name = employeeNameMap.get(member.getEmployeeId());
            if (name != null) {
                member.setEmployeeName(name);
            }
        });

        return teamMembers;

    }

    @Override
    public List<TeamMemberDTO> getAllActiveTeamMembers() throws HSException {
        return teamMemberRepository.findByStatus(Status.ACTIVE).stream()
                .map(TeamMember::toDTO)
                .toList();
    }

    @Override
    public void activateTeamMember(Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        teamMember.setStatus(Status.ACTIVE);
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    public void deactivateTeamMember(Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        teamMember.setStatus(Status.INACTIVE);
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    public List<TeamMemberDTO> getTeamMemberByTeam(Long teamId) throws HSException {
        List<TeamMemberDTO> teamMembers = ((List<TeamMember>) teamMemberRepository.findByTeam_Id(teamId)).stream()
                .map(TeamMember::toDTO).toList();
        List<Long> empIds = teamMembers.stream()
                .map(TeamMemberDTO::getEmployeeId)
                .toList();

        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> employeeNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        teamMembers.forEach(member -> {
            String name = employeeNameMap.get(member.getEmployeeId());
            if (name != null) {
                member.setEmployeeName(name);
            }
        });

        return teamMembers;
    }

    @Override
    public TeamMemberDTO getTeamMemberByEmployeeId(Long employeeId) throws HSException {
        TeamMember teamMember = teamMemberRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        TeamMemberDTO teamMemberDTO = teamMember.toDTO();

        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(List.of(employeeId));
        if (!employeeNames.isEmpty()) {
            teamMemberDTO.setEmployeeName(employeeNames.get(0).getName());
        }

        return teamMemberDTO;
    }

    @Override
    public TeamResponse getActiveTeamDetailsByEmployeeId(Long employeeId) throws HSException {
        TeamMember activeMember = teamMemberRepository.findByEmployeeIdAndStatus(employeeId, Status.ACTIVE)
                .orElseThrow(() -> new HSException("ACTIVE_TEAM_MEMBER_NOT_FOUND"));

        Long teamId = activeMember.getTeam() != null ? activeMember.getTeam().getId() : null;
        if (teamId == null) {
            throw new HSException("INCIDENT_TEAM_NOT_LINKED");
        }

        String departmentName = null;
        Long departmentId = activeMember.getTeam().getDepartmentId();
        if (departmentId != null) {
            List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(List.of(departmentId));
            if (!deptNames.isEmpty()) {
                departmentName = deptNames.get(0).getName();
            }
        }

        List<TeamMemberDTO> members = getTeamMemberByTeam(teamId);

        return new TeamResponse(teamId, activeMember.getTeam().getName(), departmentName, members);
    }

}
