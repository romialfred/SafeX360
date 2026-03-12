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
import com.minexpert.hns.dto.parameters.IncidentTeamDTO;
import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.dto.parameters.TeamRequest;
import com.minexpert.hns.dto.parameters.TeamResponse;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.entity.parameters.IncidentTeam;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.IncidentTeamRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class IncidentTeamServiceImpl implements IncidentTeamService {
    private final IncidentTeamRepository incidentTeamRepository;

    private final TeamMemberService teamMemberService;
    private final HrmsClient hrmsClient;

    @Override
    public void addIncidentTeam(TeamRequest teamRequest) throws HSException {
        Optional<IncidentTeam> opt = incidentTeamRepository.findByDepartmentId(teamRequest.getDepartmentId());
        if (opt.isPresent()) {
            throw new HSException("INCIDENT_TEAM_DEPARTMENT_ALREADY_EXISTS");
        }
        Optional<IncidentTeam> opt2 = incidentTeamRepository.findByNameIgnoreCase(teamRequest.getName());
        if (opt2.isPresent()) {
            throw new HSException("INCIDENT_TEAM_NAME_ALREADY_EXISTS");
        }
        IncidentTeamDTO incidentTeamDTO = new IncidentTeamDTO();
        incidentTeamDTO.setName(teamRequest.getName());
        incidentTeamDTO.setDepartmentId(teamRequest.getDepartmentId());
        incidentTeamDTO.setCreatedAt(LocalDateTime.now());
        incidentTeamDTO.setUpdatedAt(LocalDateTime.now());
        incidentTeamDTO.setStatus(Status.ACTIVE);
        Long id = incidentTeamRepository.save(incidentTeamDTO.toEntity()).getId();
        teamRequest.getMembers().stream().forEach(member -> {
            member.setTeamId(id);
            try {
                teamMemberService.addTeamMember(member);
            } catch (HSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        });
    }

    @Override
    public void updateIncidentTeam(TeamRequest teamRequest) throws HSException {

        IncidentTeam incidentTeam = incidentTeamRepository.findById(teamRequest.getId())
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (incidentTeam.getDepartmentId() != teamRequest.getDepartmentId()) {
            Optional<IncidentTeam> opt = incidentTeamRepository.findByDepartmentId(teamRequest.getDepartmentId());
            if (opt.isPresent()) {
                throw new HSException("INCIDENT_TEAM_DEPARTMENT_ALREADY_EXISTS");
            }
        }
        if (!incidentTeam.getName().equalsIgnoreCase(teamRequest.getName())) {
            Optional<IncidentTeam> opt2 = incidentTeamRepository.findByNameIgnoreCase(teamRequest.getName());
            if (opt2.isPresent()) {
                throw new HSException("INCIDENT_TEAM_NAME_ALREADY_EXISTS");
            }
        }
        incidentTeam.setName(teamRequest.getName());
        incidentTeam.setDepartmentId(teamRequest.getDepartmentId());
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        teamRequest.getMembers().stream().forEach(member -> {
            member.setTeamId(teamRequest.getId());
            try {
                teamMemberService.updateOrAddMember(member);
            } catch (HSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        });
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    public void deleteIncidentTeam(Long id) {
        incidentTeamRepository.deleteById(id);
    }

    @Override
    public IncidentTeamDTO getIncidentTeamById(Long id) throws HSException {
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        return incidentTeam.toDTO();
    }

    @Override
    public List<IncidentTeamDTO> getAllIncidentTeams() throws HSException {
        List<IncidentTeamDTO> incidentTeamDTOs = ((List<IncidentTeam>) incidentTeamRepository.findAll()).stream()
                .map(IncidentTeam::toDTO)
                .toList();
        List<Long> empIds = incidentTeamDTOs.stream()
                .map(IncidentTeamDTO::getDepartmentId)
                .filter(departmentId -> departmentId != null)
                .distinct()
                .toList();
        List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(empIds);
        Map<Long, String> deptIdToDtoMap = deptNames.stream()
                .collect(Collectors.toMap(DepartmentNames::getId, DepartmentNames::getName));
        incidentTeamDTOs.forEach(incidentTeamDTO -> {
            if (incidentTeamDTO.getDepartmentId() != null) {
                incidentTeamDTO.setDepartmentName(deptIdToDtoMap.get(incidentTeamDTO.getDepartmentId()));
            }
        });

        return incidentTeamDTOs;
    }

    @Override
    public List<IncidentTeamDTO> getAllActiveIncidentTeams() throws HSException {
        return ((List<IncidentTeam>) incidentTeamRepository.findByStatus(Status.ACTIVE)).stream()
                .map(IncidentTeam::toDTO)
                .toList();
    }

    @Override
    public void activateIncidentTeam(Long id) throws HSException {
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        incidentTeam.setStatus(Status.ACTIVE);
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    public void deactivateIncidentTeam(Long id) throws HSException {
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        incidentTeam.setStatus(Status.INACTIVE);
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    public TeamResponse getTeamDetailsById(Long id) throws HSException {
        IncidentTeamDTO incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND")).toDTO();
        List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(List.of(incidentTeam.getDepartmentId()));

        List<TeamMemberDTO> teamMembers = teamMemberService.getTeamMemberByTeam(id).stream()
                .filter(member -> member.getTeamId().equals(id))
                .collect(Collectors.toList());
        return new TeamResponse(id, incidentTeam.getName(), deptNames.get(0).getName(), teamMembers);
    }

}
