package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    /**
     * Mine effective pour une opération sur une entité EXISTANTE (update / activate /
     * deactivate / delete). Le paramètre {@code companyId} prime s'il désigne une mine
     * précise (utilisateur cloisonné, clampé par la gateway) ; sinon (admin « Toutes les
     * Mines » en vue consolidée) on DÉRIVE la mine de l'entité. Un utilisateur cloisonné
     * ne peut jamais toucher l'entité d'une autre mine (contrôle de propriété conservé).
     */
    private Long resolveOwningCompany(Long companyId, TeamMember existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("TEAM_MEMBER_NOT_FOUND");
        }
        return effective;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", key = "#companyId != null ? (#companyId + '-' + #teamMemberDTO.employeeId) : 'ALL-' + #teamMemberDTO.employeeId"),
            @CacheEvict(cacheNames = "teamResponseByEmployee", key = "#companyId != null ? (#companyId + '-' + #teamMemberDTO.employeeId) : 'ALL-' + #teamMemberDTO.employeeId")
    })
    public Long addTeamMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<TeamMember> opt = teamMemberRepository.findByCompanyIdAndEmployeeId(companyId,
                teamMemberDTO.getEmployeeId());
        if (opt.isPresent()) {
            throw new HSException("TEAM_MEMBER_ALREADY_EXISTS");
        }
        teamMemberDTO.setStatus(Status.ACTIVE);
        teamMemberDTO.setCompanyId(companyId);
        teamMemberDTO.setCreatedAt(LocalDateTime.now());
        teamMemberDTO.setUpdatedAt(LocalDateTime.now());
        return teamMemberRepository.save(teamMemberDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMemberById", key = "#teamMemberDTO.id != null ? (#companyId != null ? (#companyId + '-' + #teamMemberDTO.id) : 'ALL-' + #teamMemberDTO.id) : null", condition = "#teamMemberDTO.id != null"),
            @CacheEvict(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", key = "#teamMemberDTO.employeeId != null ? (#companyId != null ? (#companyId + '-' + #teamMemberDTO.employeeId) : 'ALL-' + #teamMemberDTO.employeeId) : null", condition = "#teamMemberDTO.employeeId != null"),
            @CacheEvict(cacheNames = "teamResponseByEmployee", key = "#teamMemberDTO.employeeId != null ? (#companyId != null ? (#companyId + '-' + #teamMemberDTO.employeeId) : 'ALL-' + #teamMemberDTO.employeeId) : null", condition = "#teamMemberDTO.employeeId != null")
    })
    public void updateTeamMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(teamMemberDTO.getId())
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        // Mine dérivée du membre existant si absente (édition en vue consolidée).
        resolveOwningCompany(companyId, teamMember);
        teamMember.setNotificationLevel(teamMemberDTO.getNotificationLevel() != null
                ? teamMemberDTO.getNotificationLevel().toString() : null);
        teamMember.setRole(teamMemberDTO.getRole());
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMemberById", allEntries = true),
            @CacheEvict(cacheNames = "teamMembersAll", allEntries = true),
            @CacheEvict(cacheNames = "teamMembersActive", allEntries = true),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", allEntries = true),
            @CacheEvict(cacheNames = "teamResponseByEmployee", allEntries = true)
    })
    public void updateOrAddMember(Long companyId, TeamMemberDTO teamMemberDTO) throws HSException {
        Optional<TeamMember> opt = teamMemberRepository.findByCompanyIdAndEmployeeId(companyId,
                teamMemberDTO.getEmployeeId());
        if (opt.isPresent()) {
            TeamMember teamMember = opt.get();
            // Mine dérivée du membre existant si absente (édition en vue consolidée).
            resolveOwningCompany(companyId, teamMember);
            teamMember.setNotificationLevel(teamMemberDTO.getNotificationLevel() != null
                    ? teamMemberDTO.getNotificationLevel().toString() : null);
            teamMember.setRole(teamMemberDTO.getRole());
            teamMember.setUpdatedAt(LocalDateTime.now());
            teamMemberRepository.save(teamMember);
        } else {
            addTeamMember(companyId, teamMemberDTO);
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMemberById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", allEntries = true),
            @CacheEvict(cacheNames = "teamResponseByEmployee", allEntries = true)
    })
    public void deleteTeamMember(Long companyId, Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        resolveOwningCompany(companyId, teamMember);
        teamMemberRepository.delete(teamMember);
    }

    @Override
    @Cacheable(cacheNames = "teamMemberById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public TeamMemberDTO getTeamMemberById(Long companyId, Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        if (companyId != null && !companyId.equals(teamMember.getCompanyId())) {
            throw new HSException("TEAM_MEMBER_NOT_FOUND");
        }
        return teamMember.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<TeamMemberDTO> getAllTeamMembers(Long companyId) throws HSException {
        List<TeamMemberDTO> teamMembers = teamMemberRepository.findAllByCompanyId(companyId).stream()
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
    @Cacheable(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<TeamMemberDTO> getAllActiveTeamMembers(Long companyId) throws HSException {
        return teamMemberRepository.findAllByStatus(companyId, Status.ACTIVE).stream()
                .map(TeamMember::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMemberById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", allEntries = true),
            @CacheEvict(cacheNames = "teamResponseByEmployee", allEntries = true)
    })
    public void activateTeamMember(Long companyId, Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        resolveOwningCompany(companyId, teamMember);
        teamMember.setStatus(Status.ACTIVE);
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "teamMemberById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "teamMembersAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "teamMembersByTeam", allEntries = true),
            @CacheEvict(cacheNames = "teamMemberByEmployee", allEntries = true),
            @CacheEvict(cacheNames = "teamResponseByEmployee", allEntries = true)
    })
    public void deactivateTeamMember(Long companyId, Long id) throws HSException {
        TeamMember teamMember = teamMemberRepository.findById(id)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        resolveOwningCompany(companyId, teamMember);
        teamMember.setStatus(Status.INACTIVE);
        teamMember.setUpdatedAt(LocalDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Override
    @Cacheable(cacheNames = "teamMembersByTeam", key = "#companyId != null ? (#companyId + '-' + #teamId) : 'ALL-' + #teamId")
    public List<TeamMemberDTO> getTeamMemberByTeam(Long companyId, Long teamId) throws HSException {
        List<TeamMemberDTO> teamMembers = teamMemberRepository.findAllByTeamId(companyId, teamId).stream()
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
    @Cacheable(cacheNames = "teamMemberByEmployee", key = "#companyId != null ? (#companyId + '-' + #employeeId) : 'ALL-' + #employeeId")
    public TeamMemberDTO getTeamMemberByEmployeeId(Long companyId, Long employeeId) throws HSException {
        ensureCompanyIdProvided(companyId);
        TeamMember teamMember = teamMemberRepository.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseThrow(() -> new HSException("TEAM_MEMBER_NOT_FOUND"));
        TeamMemberDTO teamMemberDTO = teamMember.toDTO();

        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(List.of(employeeId));
        if (!employeeNames.isEmpty()) {
            teamMemberDTO.setEmployeeName(employeeNames.get(0).getName());
        }

        return teamMemberDTO;
    }

    @Override
    @Cacheable(cacheNames = "teamResponseByEmployee", key = "#companyId != null ? (#companyId + '-' + #employeeId) : 'ALL-' + #employeeId")
    public TeamResponse getActiveTeamDetailsByEmployeeId(Long companyId, Long employeeId) throws HSException {
        ensureCompanyIdProvided(companyId);
        TeamMember activeMember = teamMemberRepository.findByCompanyIdAndEmployeeIdAndStatus(companyId, employeeId,
                Status.ACTIVE)
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

        List<TeamMemberDTO> members = getTeamMemberByTeam(companyId, teamId);

        return new TeamResponse(teamId, activeMember.getTeam().getName(), departmentName, companyId, members);
    }

}
