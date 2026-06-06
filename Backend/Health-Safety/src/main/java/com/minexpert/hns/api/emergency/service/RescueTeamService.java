package com.minexpert.hns.api.emergency.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.RescueShiftDTO;
import com.minexpert.hns.api.emergency.dto.RescueTeamDTO;
import com.minexpert.hns.api.emergency.dto.RescueTeamMemberDTO;
import com.minexpert.hns.api.emergency.entity.RescueShift;
import com.minexpert.hns.api.emergency.entity.RescueTeam;
import com.minexpert.hns.api.emergency.entity.RescueTeamMember;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.RescueShiftRepository;
import com.minexpert.hns.api.emergency.repository.RescueTeamMemberRepository;
import com.minexpert.hns.api.emergency.repository.RescueTeamRepository;

import lombok.RequiredArgsConstructor;

/** CRUD complet équipes + membres + shifts (LOT 48 Phase 1.c). */
@Service
@RequiredArgsConstructor
public class RescueTeamService {

    private final RescueTeamRepository teamRepo;
    private final RescueTeamMemberRepository memberRepo;
    private final RescueShiftRepository shiftRepo;
    private final EmergencyAuditService auditService;

    // ─── Équipes ───────────────────────────────────────────────────────────

    public List<RescueTeamDTO> listTeams(Long companyId) {
        return teamRepo.findByCompanyIdOrderByNameAsc(companyId).stream()
            .map(this::toTeamDto)
            .toList();
    }

    @Transactional
    public RescueTeamDTO createTeam(RescueTeamDTO dto, Long actorId) {
        RescueTeam team = new RescueTeam();
        team.setName(dto.getName());
        team.setDescription(dto.getDescription());
        team.setCompanyId(dto.getCompanyId());
        team.setStatus(dto.getStatus() == null ? "ACTIVE" : dto.getStatus());
        RescueTeam saved = teamRepo.save(team);
        auditService.log(
            EmergencyAuditEventType.RESCUE_TEAM_CREATED,
            actorId, dto.getCompanyId(),
            "RescueTeam", saved.getId(), null, null, null
        );
        return toTeamDto(saved);
    }

    @Transactional
    public Optional<RescueTeamDTO> updateTeam(Long id, RescueTeamDTO dto, Long actorId) {
        return teamRepo.findById(id).map(team -> {
            if (dto.getName() != null) team.setName(dto.getName());
            if (dto.getDescription() != null) team.setDescription(dto.getDescription());
            if (dto.getStatus() != null) team.setStatus(dto.getStatus());
            RescueTeam saved = teamRepo.save(team);
            auditService.log(
                EmergencyAuditEventType.RESCUE_TEAM_UPDATED,
                actorId, team.getCompanyId(),
                "RescueTeam", saved.getId(), null, null, null
            );
            return toTeamDto(saved);
        });
    }

    @Transactional
    public boolean deleteTeam(Long id, Long actorId) {
        return teamRepo.findById(id).map(team -> {
            // Soft delete via status (préserver l'historique audit)
            team.setStatus("INACTIVE");
            teamRepo.save(team);
            auditService.log(
                EmergencyAuditEventType.RESCUE_TEAM_UPDATED,
                actorId, team.getCompanyId(),
                "RescueTeam", id,
                "{\"action\":\"soft_delete\"}", null, null
            );
            return true;
        }).orElse(false);
    }

    // ─── Membres ───────────────────────────────────────────────────────────

    public List<RescueTeamMemberDTO> listMembers(Long teamId) {
        return memberRepo.findByTeamId(teamId).stream().map(this::toMemberDto).toList();
    }

    @Transactional
    public RescueTeamMemberDTO addMember(RescueTeamMemberDTO dto, Long actorId) {
        RescueTeamMember m = new RescueTeamMember();
        m.setTeamId(dto.getTeamId());
        m.setEmployeeId(dto.getEmployeeId());
        m.setRole(dto.getRole());
        m.setIsTeamLeader(Boolean.TRUE.equals(dto.getIsTeamLeader()));
        RescueTeamMember saved = memberRepo.save(m);
        auditService.log(
            EmergencyAuditEventType.RESCUE_TEAM_MEMBER_ADDED,
            actorId, null,
            "RescueTeamMember", saved.getId(),
            "{\"team\":" + dto.getTeamId() + ",\"emp\":" + dto.getEmployeeId() + "}",
            null, null
        );
        return toMemberDto(saved);
    }

    @Transactional
    public boolean removeMember(Long memberId, Long actorId) {
        return memberRepo.findById(memberId).map(m -> {
            memberRepo.delete(m);
            auditService.log(
                EmergencyAuditEventType.RESCUE_TEAM_MEMBER_REMOVED,
                actorId, null,
                "RescueTeamMember", memberId, null, null, null
            );
            return true;
        }).orElse(false);
    }

    // ─── Shifts ────────────────────────────────────────────────────────────

    public List<RescueShiftDTO> listShifts(Long teamId) {
        return shiftRepo.findByTeamIdOrderByStartTimeAsc(teamId).stream()
            .map(this::toShiftDto).toList();
    }

    @Transactional
    public RescueShiftDTO createShift(RescueShiftDTO dto, Long actorId) {
        RescueShift s = new RescueShift();
        s.setTeamId(dto.getTeamId());
        s.setShiftType(dto.getShiftType());
        s.setStartTime(dto.getStartTime());
        s.setEndTime(dto.getEndTime());
        if (dto.getDaysOfWeek() != null) s.setDaysOfWeek(dto.getDaysOfWeek());
        if (dto.getValidFrom() != null) s.setValidFrom(dto.getValidFrom());
        s.setValidTo(dto.getValidTo());
        if (dto.getStatus() != null) s.setStatus(dto.getStatus());
        RescueShift saved = shiftRepo.save(s);
        auditService.log(
            EmergencyAuditEventType.SHIFT_CREATED,
            actorId, null,
            "RescueShift", saved.getId(), null, null, null
        );
        return toShiftDto(saved);
    }

    @Transactional
    public boolean deleteShift(Long shiftId, Long actorId) {
        return shiftRepo.findById(shiftId).map(s -> {
            shiftRepo.delete(s);
            auditService.log(
                EmergencyAuditEventType.SHIFT_UPDATED,
                actorId, null,
                "RescueShift", shiftId,
                "{\"action\":\"delete\"}", null, null
            );
            return true;
        }).orElse(false);
    }

    // ─── Mappers ───────────────────────────────────────────────────────────

    private RescueTeamDTO toTeamDto(RescueTeam team) {
        return RescueTeamDTO.builder()
            .id(team.getId())
            .name(team.getName())
            .description(team.getDescription())
            .companyId(team.getCompanyId())
            .status(team.getStatus())
            .memberCount(memberRepo.findByTeamId(team.getId()).size())
            .shiftCount(shiftRepo.findByTeamIdOrderByStartTimeAsc(team.getId()).size())
            .build();
    }

    private RescueTeamMemberDTO toMemberDto(RescueTeamMember m) {
        return RescueTeamMemberDTO.builder()
            .id(m.getId())
            .teamId(m.getTeamId())
            .employeeId(m.getEmployeeId())
            .role(m.getRole())
            .isTeamLeader(m.getIsTeamLeader())
            .build();
    }

    private RescueShiftDTO toShiftDto(RescueShift s) {
        return RescueShiftDTO.builder()
            .id(s.getId())
            .teamId(s.getTeamId())
            .shiftType(s.getShiftType())
            .startTime(s.getStartTime())
            .endTime(s.getEndTime())
            .daysOfWeek(s.getDaysOfWeek())
            .validFrom(s.getValidFrom())
            .validTo(s.getValidTo())
            .status(s.getStatus())
            .build();
    }
}
