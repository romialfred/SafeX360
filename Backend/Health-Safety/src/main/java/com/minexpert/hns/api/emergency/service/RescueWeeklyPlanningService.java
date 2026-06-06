package com.minexpert.hns.api.emergency.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.RescueWeeklyPlanningDTO;
import com.minexpert.hns.api.emergency.entity.RescueTeam;
import com.minexpert.hns.api.emergency.entity.RescueWeeklyPlanning;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.RescueTeamRepository;
import com.minexpert.hns.api.emergency.repository.RescueWeeklyPlanningRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service planification hebdomadaire d'urgence (LOT 48 Phase 1.c.2).
 *
 * <p>Règles métier :</p>
 * <ul>
 *   <li>La date {@code weekStartDate} est <strong>toujours</strong> normalisée au
 *       lundi de la semaine (sinon planning ambigu côté UI).</li>
 *   <li>L'unicité {@code (companyId, weekStartDate)} est garantie en BDD + ici
 *       (upsert si la semaine existe déjà).</li>
 *   <li>Le DTO résolu inclut les noms d'équipes (lookup) pour éviter un round-trip
 *       côté front.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class RescueWeeklyPlanningService {

    private final RescueWeeklyPlanningRepository repo;
    private final RescueTeamRepository teamRepo;
    private final EmergencyAuditService auditService;

    // ─── Lecture ──────────────────────────────────────────────────────────────

    public List<RescueWeeklyPlanningDTO> listForCompany(Long companyId) {
        Map<Long, String> teamNames = loadTeamNames(companyId);
        return repo.findByCompanyIdOrderByWeekStartDateDesc(companyId).stream()
            .map(p -> toDto(p, teamNames))
            .toList();
    }

    public List<RescueWeeklyPlanningDTO> listBetween(Long companyId, LocalDate from, LocalDate to) {
        Map<Long, String> teamNames = loadTeamNames(companyId);
        return repo.findByCompanyIdAndWeekStartDateBetweenOrderByWeekStartDateAsc(
                companyId, normalizeToMonday(from), normalizeToMonday(to))
            .stream()
            .map(p -> toDto(p, teamNames))
            .toList();
    }

    public Optional<RescueWeeklyPlanningDTO> getForWeek(Long companyId, LocalDate weekStartDate) {
        LocalDate monday = normalizeToMonday(weekStartDate);
        Map<Long, String> teamNames = loadTeamNames(companyId);
        return repo.findByCompanyIdAndWeekStartDate(companyId, monday)
            .map(p -> toDto(p, teamNames));
    }

    // ─── Écriture (upsert par semaine) ────────────────────────────────────────

    @Transactional
    public RescueWeeklyPlanningDTO upsert(RescueWeeklyPlanningDTO dto, Long actorId) {
        LocalDate monday = normalizeToMonday(dto.getWeekStartDate());

        RescueWeeklyPlanning entity = repo
            .findByCompanyIdAndWeekStartDate(dto.getCompanyId(), monday)
            .orElseGet(() -> {
                RescueWeeklyPlanning fresh = new RescueWeeklyPlanning();
                fresh.setCompanyId(dto.getCompanyId());
                fresh.setWeekStartDate(monday);
                return fresh;
            });

        entity.setDayTeamId(dto.getDayTeamId());
        entity.setNightTeamId(dto.getNightTeamId());
        entity.setDayStartHour(coalesce(dto.getDayStartHour(), "06:00"));
        entity.setDayEndHour(coalesce(dto.getDayEndHour(), "18:00"));
        entity.setNightStartHour(coalesce(dto.getNightStartHour(), "18:00"));
        entity.setNightEndHour(coalesce(dto.getNightEndHour(), "06:00"));
        entity.setNotes(dto.getNotes());
        if (dto.getStatus() != null) entity.setStatus(dto.getStatus());

        boolean isNew = entity.getId() == null;
        RescueWeeklyPlanning saved = repo.save(entity);
        // PrePersist gère createdAt ; PreUpdate gère updatedAt — pour les
        // entités déjà existantes (upsert), force updatedAt côté Java.
        if (!isNew) saved.setUpdatedAt(LocalDateTime.now());

        auditService.log(
            isNew ? EmergencyAuditEventType.SHIFT_CREATED : EmergencyAuditEventType.SHIFT_UPDATED,
            actorId, dto.getCompanyId(),
            "RescueWeeklyPlanning", saved.getId(),
            "{\"week\":\"" + monday + "\",\"day\":" + dto.getDayTeamId()
                + ",\"night\":" + dto.getNightTeamId() + "}",
            null, null
        );

        Map<Long, String> teamNames = loadTeamNames(dto.getCompanyId());
        return toDto(saved, teamNames);
    }

    @Transactional
    public boolean delete(Long id, Long actorId) {
        return repo.findById(id).map(p -> {
            Long companyId = p.getCompanyId();
            repo.delete(p);
            auditService.log(
                EmergencyAuditEventType.SHIFT_UPDATED,
                actorId, companyId,
                "RescueWeeklyPlanning", id,
                "{\"action\":\"delete\"}", null, null
            );
            return true;
        }).orElse(false);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Map<Long, String> loadTeamNames(Long companyId) {
        return teamRepo.findByCompanyIdOrderByNameAsc(companyId).stream()
            .collect(Collectors.toMap(RescueTeam::getId, RescueTeam::getName, (a, b) -> a, HashMap::new));
    }

    private LocalDate normalizeToMonday(LocalDate date) {
        if (date == null) return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        if (date.getDayOfWeek() == DayOfWeek.MONDAY) return date;
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private String coalesce(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private RescueWeeklyPlanningDTO toDto(RescueWeeklyPlanning p, Map<Long, String> teamNames) {
        return RescueWeeklyPlanningDTO.builder()
            .id(p.getId())
            .companyId(p.getCompanyId())
            .weekStartDate(p.getWeekStartDate())
            .dayTeamId(p.getDayTeamId())
            .dayTeamName(p.getDayTeamId() != null ? teamNames.get(p.getDayTeamId()) : null)
            .nightTeamId(p.getNightTeamId())
            .nightTeamName(p.getNightTeamId() != null ? teamNames.get(p.getNightTeamId()) : null)
            .dayStartHour(p.getDayStartHour())
            .dayEndHour(p.getDayEndHour())
            .nightStartHour(p.getNightStartHour())
            .nightEndHour(p.getNightEndHour())
            .notes(p.getNotes())
            .status(p.getStatus())
            .build();
    }
}
