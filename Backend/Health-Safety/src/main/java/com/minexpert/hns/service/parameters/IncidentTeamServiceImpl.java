package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class IncidentTeamServiceImpl implements IncidentTeamService {

    private static final Logger log = LoggerFactory.getLogger(IncidentTeamServiceImpl.class);

    private final IncidentTeamRepository incidentTeamRepository;

    private final TeamMemberService teamMemberService;
    private final HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamDetails", allEntries = true)
    })
    public void addIncidentTeam(Long companyId, TeamRequest teamRequest) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<IncidentTeam> opt = incidentTeamRepository.findByCompanyIdAndDepartmentId(companyId,
                teamRequest.getDepartmentId());
        if (opt.isPresent()) {
            throw new HSException("INCIDENT_TEAM_DEPARTMENT_ALREADY_EXISTS");
        }
        Optional<IncidentTeam> opt2 = incidentTeamRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                teamRequest.getName());
        if (opt2.isPresent()) {
            throw new HSException("INCIDENT_TEAM_NAME_ALREADY_EXISTS");
        }
        IncidentTeamDTO incidentTeamDTO = new IncidentTeamDTO();
        incidentTeamDTO.setName(teamRequest.getName());
        incidentTeamDTO.setDepartmentId(teamRequest.getDepartmentId());
        incidentTeamDTO.setCompanyId(companyId);
        incidentTeamDTO.setCreatedAt(LocalDateTime.now());
        incidentTeamDTO.setUpdatedAt(LocalDateTime.now());
        incidentTeamDTO.setStatus(Status.ACTIVE);
        Long id = incidentTeamRepository.save(incidentTeamDTO.toEntity()).getId();
        if (teamRequest.getMembers() != null) {
            teamRequest.getMembers().forEach(member -> {
                member.setTeamId(id);
                member.setCompanyId(companyId);
                try {
                    teamMemberService.addTeamMember(companyId, member);
                } catch (HSException e) {
                    log.error("Failed to process team member: {}", e.getMessage());
                }
            });
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTeamById", key = "#companyId != null && #teamRequest.id != null ? (#companyId + '-' + #teamRequest.id) : 'ALL-' + #teamRequest.id", condition = "#teamRequest.id != null"),
            @CacheEvict(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamDetails", allEntries = true)
    })
    public void updateIncidentTeam(Long companyId, TeamRequest teamRequest) throws HSException {
        ensureCompanyIdProvided(companyId);

        IncidentTeam incidentTeam = incidentTeamRepository.findById(teamRequest.getId())
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (!companyId.equals(incidentTeam.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        if (!java.util.Objects.equals(incidentTeam.getDepartmentId(), teamRequest.getDepartmentId())) {
            Optional<IncidentTeam> opt = incidentTeamRepository.findByCompanyIdAndDepartmentId(companyId,
                    teamRequest.getDepartmentId());
            if (opt.isPresent()) {
                throw new HSException("INCIDENT_TEAM_DEPARTMENT_ALREADY_EXISTS");
            }
        }
        if (!incidentTeam.getName().equalsIgnoreCase(teamRequest.getName())) {
            Optional<IncidentTeam> opt2 = incidentTeamRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    teamRequest.getName());
            if (opt2.isPresent()) {
                throw new HSException("INCIDENT_TEAM_NAME_ALREADY_EXISTS");
            }
        }
        incidentTeam.setName(teamRequest.getName());
        incidentTeam.setDepartmentId(teamRequest.getDepartmentId());
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        if (teamRequest.getMembers() != null) {
            teamRequest.getMembers().forEach(member -> {
                member.setTeamId(teamRequest.getId());
                member.setCompanyId(companyId);
                try {
                    teamMemberService.updateOrAddMember(companyId, member);
                } catch (HSException e) {
                    log.error("Failed to process team member: {}", e.getMessage());
                }
            });
        }
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTeamById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamDetails", allEntries = true)
    })
    public void deleteIncidentTeam(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentTeam team = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (!companyId.equals(team.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        incidentTeamRepository.delete(team);
    }

    @Override
    @Cacheable(cacheNames = "incidentTeamById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentTeamDTO getIncidentTeamById(Long companyId, Long id) throws HSException {
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (companyId != null && !companyId.equals(incidentTeam.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        return incidentTeam.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentTeamDTO> getAllIncidentTeams(Long companyId) throws HSException {
        List<IncidentTeamDTO> incidentTeamDTOs = incidentTeamRepository.findAllByCompanyId(companyId).stream()
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
    @Cacheable(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentTeamDTO> getAllActiveIncidentTeams(Long companyId) throws HSException {
        return incidentTeamRepository.findAllByStatus(companyId, Status.ACTIVE).stream()
                .map(IncidentTeam::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTeamById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamDetails", allEntries = true)
    })
    public void activateIncidentTeam(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (!companyId.equals(incidentTeam.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        incidentTeam.setStatus(Status.ACTIVE);
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTeamById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTeamsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTeamDetails", allEntries = true)
    })
    public void deactivateIncidentTeam(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentTeam incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND"));
        if (!companyId.equals(incidentTeam.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        incidentTeam.setStatus(Status.INACTIVE);
        incidentTeam.setUpdatedAt(LocalDateTime.now());
        incidentTeamRepository.save(incidentTeam);
    }

    @Override
    @Cacheable(cacheNames = "incidentTeamDetails", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public TeamResponse getTeamDetailsById(Long companyId, Long id) throws HSException {
        IncidentTeamDTO incidentTeam = incidentTeamRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TEAM_NOT_FOUND")).toDTO();
        if (companyId != null && !companyId.equals(incidentTeam.getCompanyId())) {
            throw new HSException("INCIDENT_TEAM_NOT_FOUND");
        }
        String departmentName = null;
        Long departmentId = incidentTeam.getDepartmentId();
        if (departmentId != null) {
            List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(List.of(departmentId));
            if (!deptNames.isEmpty()) {
                departmentName = deptNames.get(0).getName();
            }
        }

        List<TeamMemberDTO> teamMembers = teamMemberService.getTeamMemberByTeam(companyId, id).stream()
                .filter(member -> member.getTeamId().equals(id))
                .collect(Collectors.toList());
        return new TeamResponse(id, incidentTeam.getName(), departmentName, companyId, teamMembers);
    }

}
