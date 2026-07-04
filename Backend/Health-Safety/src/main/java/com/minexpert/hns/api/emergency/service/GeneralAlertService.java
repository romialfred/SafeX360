package com.minexpert.hns.api.emergency.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
import lombok.extern.slf4j.Slf4j;

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
@Slf4j
@Service
@RequiredArgsConstructor
public class GeneralAlertService {

    private final GeneralAlertRepository alertRepo;
    private final EvacuationCheckInRepository checkInRepo;
    private final AssemblyPointRepository apRepo;
    private final EmergencyAuditService auditService;
    private final SimpMessagingTemplate messaging;
    private final EmergencyEmailService emergencyEmailService;

    // ── Lecture ──────────────────────────────────────────────────────────────

    public Optional<GeneralAlertDTO> getActive(Long companyId) {
        return alertRepo.findFirstByCompanyIdAndStatusOrderByTriggeredAtDesc(
                companyId, GeneralAlertStatus.ACTIVE
            ).map(this::toDto);
    }

    public List<GeneralAlertDTO> list(Long companyId) {
        List<GeneralAlert> alerts = alertRepo.findByCompanyIdOrderByTriggeredAtDesc(companyId);
        if (alerts.isEmpty()) return List.of();

        List<Long> alertIds = alerts.stream().map(GeneralAlert::getId).toList();
        Map<Long, List<EvacuationCheckIn>> checkInsByAlert = checkInRepo.findByGeneralAlertIdIn(alertIds)
                .stream().collect(Collectors.groupingBy(EvacuationCheckIn::getGeneralAlertId));

        return alerts.stream()
            .map(a -> toDtoWithCheckIns(a, checkInsByAlert.getOrDefault(a.getId(), Collections.emptyList())))
            .toList();
    }

    public Optional<GeneralAlertDTO> get(Long id) {
        return alertRepo.findById(id).map(this::toDto);
    }

    public List<EvacuationCheckInDTO> getCheckIns(Long alertId) {
        List<EvacuationCheckIn> checkIns = checkInRepo.findByGeneralAlertIdOrderByCheckedAtDesc(alertId);
        if (checkIns.isEmpty()) return List.of();

        List<Long> apIds = checkIns.stream()
                .map(EvacuationCheckIn::getAssemblyPointId)
                .filter(id -> id != null)
                .distinct().toList();
        Map<Long, String> apNames = apIds.isEmpty() ? Map.of()
                : apRepo.findAllById(apIds).stream()
                    .collect(Collectors.toMap(AssemblyPoint::getId, AssemblyPoint::getName));

        return checkIns.stream()
            .map(c -> toCheckInDtoWithNames(c, apNames))
            .toList();
    }

    // ── Trigger / End ────────────────────────────────────────────────────────

    @Transactional
    public GeneralAlertDTO trigger(GeneralAlertRequest req, Long actorId) {
        Optional<GeneralAlert> existing = alertRepo
            .findFirstActiveForUpdate(req.getCompanyId(), GeneralAlertStatus.ACTIVE);
        if (existing.isPresent()) {
            GeneralAlertDTO existingDto = toDto(existing.get());
            broadcast(existing.get().getCompanyId(), existingDto);
            return existingDto;
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
            "{\"reason\":\"" + jsonEscape(req.getReasonCode()) + "\",\"drill\":" + saved.getDrillMode() + "}",
            null, null
        );

        GeneralAlertDTO dto = toDto(saved);
        broadcast(saved.getCompanyId(), dto);

        try {
            emergencyEmailService.notifyGeneralAlertTriggered(
                    saved.getId(), req.getReasonCode(), req.getMessage(),
                    saved.getDrillMode(), saved.getCompanyId());
        } catch (Exception e) {
            log.warn("Email notification failed for GeneralAlert: {}", e.getMessage());
        }

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

            try {
                emergencyEmailService.notifyGeneralAlertEnded(
                        saved.getId(), dto.getSafeCount(),
                        dto.getInjuredCount(), dto.getMissingCount());
            } catch (Exception e) {
                log.warn("Email notification failed for GeneralAlert end: {}", e.getMessage());
            }

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

        String apName = (saved.getAssemblyPointId() != null)
                ? apRepo.findById(saved.getAssemblyPointId()).map(AssemblyPoint::getName).orElse(null)
                : null;
        return toCheckInDtoWithNames(saved, apName != null
                ? Map.of(saved.getAssemblyPointId(), apName) : Map.of());
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
        return toDtoWithCheckIns(a, checkIns);
    }

    private GeneralAlertDTO toDtoWithCheckIns(GeneralAlert a, List<EvacuationCheckIn> checkIns) {
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

    private EvacuationCheckInDTO toCheckInDtoWithNames(EvacuationCheckIn c, Map<Long, String> apNames) {
        String apName = (c.getAssemblyPointId() != null) ? apNames.get(c.getAssemblyPointId()) : null;
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

    private String jsonEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
