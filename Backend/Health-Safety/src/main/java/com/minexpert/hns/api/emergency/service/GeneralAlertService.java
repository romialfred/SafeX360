package com.minexpert.hns.api.emergency.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EvacuationCheckInDTO;
import com.minexpert.hns.api.emergency.dto.GeneralAlertDTO;
import com.minexpert.hns.api.emergency.dto.GeneralAlertRequest;
import com.minexpert.hns.api.emergency.entity.AssemblyPoint;
import com.minexpert.hns.api.emergency.entity.EvacuationCheckIn;
import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.enums.CheckInStatus;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;
import com.minexpert.hns.api.emergency.repository.AssemblyPointRepository;
import com.minexpert.hns.api.emergency.repository.EvacuationCheckInRepository;
import com.minexpert.hns.api.emergency.repository.GeneralAlertRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service Alerte Générale + Évacuation Head-count (LOT 48 Phase 4).
 *
 * <p>Workflow type :</p>
 * <ol>
 *   <li>Lanceur d'alerte appelle {@code trigger()} → ACTIVE, broadcast à tous</li>
 *   <li>Frontend affiche popup gyrophare + lance sirène + voix TTS</li>
 *   <li>Employés pointent via {@code checkIn()} avec leur statut + GPS</li>
 *   <li>Coordinateur suit en temps réel le tableau evacuation</li>
 *   <li>Quand tous safe (ou décision opérationnelle), {@code end()} → ENDED</li>
 * </ol>
 *
 * <p>Broadcast sur topic {@code /topic/emergency/alert/company/{id}} à chaque
 * mutation (trigger/checkIn/end) avec le DTO incluant les stats live.</p>
 */
@Service
@RequiredArgsConstructor
public class GeneralAlertService {

    private final GeneralAlertRepository alertRepo;
    private final EvacuationCheckInRepository checkInRepo;
    private final AssemblyPointRepository apRepo;
    private final EmergencyAuditService auditService;
    private final SimpMessagingTemplate messaging;

    // ── Lecture ──────────────────────────────────────────────────────────────

    public Optional<GeneralAlertDTO> getActive(Long companyId) {
        return alertRepo.findFirstByCompanyIdAndStatusOrderByTriggeredAtDesc(
                companyId, GeneralAlertStatus.ACTIVE
            ).map(this::toDto);
    }

    public List<GeneralAlertDTO> list(Long companyId) {
        return alertRepo.findByCompanyIdOrderByTriggeredAtDesc(companyId).stream()
            .map(this::toDto)
            .toList();
    }

    public Optional<GeneralAlertDTO> get(Long id) {
        return alertRepo.findById(id).map(this::toDto);
    }

    public List<EvacuationCheckInDTO> getCheckIns(Long alertId) {
        return checkInRepo.findByGeneralAlertIdOrderByCheckedAtDesc(alertId).stream()
            .map(this::toCheckInDto)
            .toList();
    }

    // ── Trigger / End ────────────────────────────────────────────────────────

    @Transactional
    public GeneralAlertDTO trigger(GeneralAlertRequest req, Long actorId) {
        // Politique : si une alerte ACTIVE existe déjà pour la mine, on
        // retourne celle-ci au lieu d'en créer une nouvelle (idempotence).
        Optional<GeneralAlert> existing = alertRepo
            .findFirstByCompanyIdAndStatusOrderByTriggeredAtDesc(req.getCompanyId(), GeneralAlertStatus.ACTIVE);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        GeneralAlert a = new GeneralAlert();
        a.setCompanyId(req.getCompanyId());
        a.setTriggeredBy(actorId);
        a.setReasonCode(req.getReasonCode());
        a.setMessage(req.getMessage());
        a.setDrillMode(Boolean.TRUE.equals(req.getDrillMode()));
        a.setStatus(GeneralAlertStatus.ACTIVE);
        GeneralAlert saved = alertRepo.save(a);

        auditService.log(
            EmergencyAuditEventType.ALERT_TRIGGERED,
            actorId, saved.getCompanyId(),
            "GeneralAlert", saved.getId(),
            "{\"reason\":\"" + safe(req.getReasonCode()) + "\",\"drill\":" + saved.getDrillMode() + "}",
            null, null
        );

        GeneralAlertDTO dto = toDto(saved);
        broadcast(saved.getCompanyId(), dto);
        return dto;
    }

    @Transactional
    public Optional<GeneralAlertDTO> end(Long id, Long actorId) {
        return alertRepo.findById(id).map(a -> {
            if (a.getStatus() == GeneralAlertStatus.ENDED) {
                return toDto(a);
            }
            a.setStatus(GeneralAlertStatus.ENDED);
            a.setEndedBy(actorId);
            a.setEndedAt(LocalDateTime.now());
            GeneralAlert saved = alertRepo.save(a);
            auditService.log(
                EmergencyAuditEventType.ALERT_ENDED,
                actorId, saved.getCompanyId(),
                "GeneralAlert", saved.getId(), null, null, null
            );
            GeneralAlertDTO dto = toDto(saved);
            broadcast(saved.getCompanyId(), dto);
            return dto;
        });
    }

    // ── Check-in ─────────────────────────────────────────────────────────────

    @Transactional
    public EvacuationCheckInDTO checkIn(
        Long alertId,
        Long employeeId,
        Long assemblyPointId,
        CheckInStatus status,
        Double latitude, Double longitude, Float gpsAccuracy,
        String note,
        Long actorId
    ) {
        // Upsert : si l'employé a déjà pointé, on met à jour
        EvacuationCheckIn ci = checkInRepo
            .findByGeneralAlertIdAndEmployeeId(alertId, employeeId)
            .orElseGet(() -> {
                EvacuationCheckIn fresh = new EvacuationCheckIn();
                fresh.setGeneralAlertId(alertId);
                fresh.setEmployeeId(employeeId);
                return fresh;
            });

        ci.setAssemblyPointId(assemblyPointId);
        ci.setStatus(status != null ? status : CheckInStatus.SAFE);
        ci.setLatitude(latitude);
        ci.setLongitude(longitude);
        ci.setGpsAccuracy(gpsAccuracy);
        ci.setNote(note);
        ci.setCheckedBy(actorId);
        ci.setCheckedAt(LocalDateTime.now());
        EvacuationCheckIn saved = checkInRepo.save(ci);

        // Broadcast l'alerte mise à jour pour refresh des stats côté UI
        alertRepo.findById(alertId).ifPresent(a -> broadcast(a.getCompanyId(), toDto(a)));

        return toCheckInDto(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void broadcast(Long companyId, GeneralAlertDTO payload) {
        messaging.convertAndSend("/topic/emergency/alert/company/" + companyId, payload);
        if (payload.getId() != null) {
            messaging.convertAndSend("/topic/emergency/alert/" + payload.getId(), payload);
        }
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private GeneralAlertDTO toDto(GeneralAlert a) {
        List<EvacuationCheckIn> checkIns = checkInRepo.findByGeneralAlertIdOrderByCheckedAtDesc(a.getId());
        int safe = 0, injured = 0, missing = 0;
        for (EvacuationCheckIn c : checkIns) {
            switch (c.getStatus()) {
                case SAFE -> safe++;
                case INJURED -> injured++;
                case MISSING -> missing++;
            }
        }
        LocalDateTime end = a.getEndedAt() != null ? a.getEndedAt() : LocalDateTime.now();
        long elapsed = Duration.between(a.getTriggeredAt(), end).getSeconds();

        return GeneralAlertDTO.builder()
            .id(a.getId())
            .companyId(a.getCompanyId())
            .triggeredBy(a.getTriggeredBy())
            .endedBy(a.getEndedBy())
            .status(a.getStatus())
            .reasonCode(a.getReasonCode())
            .message(a.getMessage())
            .drillMode(a.getDrillMode())
            .triggeredAt(a.getTriggeredAt())
            .endedAt(a.getEndedAt())
            .elapsedSeconds(elapsed)
            .checkedInCount(checkIns.size())
            .safeCount(safe)
            .injuredCount(injured)
            .missingCount(missing)
            .build();
    }

    private EvacuationCheckInDTO toCheckInDto(EvacuationCheckIn c) {
        String apName = null;
        if (c.getAssemblyPointId() != null) {
            apName = apRepo.findById(c.getAssemblyPointId())
                .map(AssemblyPoint::getName)
                .orElse(null);
        }
        return EvacuationCheckInDTO.builder()
            .id(c.getId())
            .generalAlertId(c.getGeneralAlertId())
            .employeeId(c.getEmployeeId())
            .assemblyPointId(c.getAssemblyPointId())
            .assemblyPointName(apName)
            .status(c.getStatus())
            .latitude(c.getLatitude())
            .longitude(c.getLongitude())
            .gpsAccuracy(c.getGpsAccuracy())
            .checkedBy(c.getCheckedBy())
            .note(c.getNote())
            .checkedAt(c.getCheckedAt())
            .build();
    }

    private String safe(String s) { return s == null ? "" : s; }

    @SuppressWarnings("unused")
    private Map<String, Object> emptyMap() { return new HashMap<>(); }
}
