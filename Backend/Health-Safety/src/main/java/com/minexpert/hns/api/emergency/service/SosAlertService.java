package com.minexpert.hns.api.emergency.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.api.emergency.dto.SosAlertDTO;
import com.minexpert.hns.api.emergency.dto.SosLifecycleEventDTO;
import com.minexpert.hns.api.emergency.dto.SosTransitionRequest;
import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.entity.SosLifecycleEvent;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.enums.EmergencyPermission;
import com.minexpert.hns.api.emergency.enums.SosStatus;
import com.minexpert.hns.api.emergency.repository.RescueTeamRepository;
import com.minexpert.hns.api.emergency.repository.SosAlertRepository;
import com.minexpert.hns.api.emergency.repository.SosLifecycleEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service principal du cycle de vie d'un SOS (LOT 48 Phase 3.a).
 *
 * <p>Responsabilités :</p>
 * <ul>
 *   <li>Création d'alerte (transition implicite {@code → RECEIVED})</li>
 *   <li>Transitions contrôlées par machine à état + horodatage automatique</li>
 *   <li>Enregistrement d'un {@link SosLifecycleEvent} à chaque transition</li>
 *   <li>Log d'audit ISO 45001 via {@link EmergencyAuditService}</li>
 *   <li>Broadcast STOMP sur {@code /topic/emergency/sos/company/{companyId}}
 *       et {@code /topic/emergency/sos/{id}}</li>
 * </ul>
 *
 * <p>La machine à état rejette toute transition non autorisée avec
 * {@link IllegalStateException}, prévenant les races et corruptions.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SosAlertService {

    private final SosAlertRepository alertRepo;
    private final SosLifecycleEventRepository eventRepo;
    private final RescueTeamRepository teamRepo;
    private final EmergencyAuditService auditService;
    private final SimpMessagingTemplate messaging;
    private final EmergencyEmailService emergencyEmailService;
    private final EmergencyPermissionService permissionService;

    /**
     * Clôture d'un SOS (CLOSED / FALSE_ALARM) réservée aux COORDINATEURS : sans
     * clôture explicite par un coordinateur, le SOS reste ouvert et son
     * traitement actif — y compris après un redémarrage (état persisté).
     * Les transitions intermédiaires (acknowledge, dispatch, on-site) restent
     * ouvertes aux intervenants.
     */
    private void requireCoordinator(Long actorId, Long companyId) {
        boolean ok = isPlatformAdmin() || (actorId != null && (
            permissionService.hasPermission(actorId, EmergencyPermission.COORDINATOR, companyId)
            || permissionService.hasPermission(actorId, EmergencyPermission.COORDINATOR, null)));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COORDINATOR_REQUIRED");
        }
    }

    /** Admin plateforme (autorité INSPECTION_ADMIN, cf. GeneralAlertService). */
    private boolean isPlatformAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
            .anyMatch(a -> "INSPECTION_ADMIN".equals(a.getAuthority()));
    }

    // ─── Transitions autorisées ──────────────────────────────────────────────

    /** Pour chaque état, l'ensemble des états de transition autorisés. */
    private static final Map<SosStatus, Set<SosStatus>> TRANSITIONS = Map.of(
        SosStatus.RECEIVED,     Set.of(SosStatus.ACKNOWLEDGED, SosStatus.FALSE_ALARM),
        SosStatus.ACKNOWLEDGED, Set.of(SosStatus.DISPATCHED, SosStatus.FALSE_ALARM, SosStatus.CLOSED),
        SosStatus.DISPATCHED,   Set.of(SosStatus.ON_SITE, SosStatus.CLOSED, SosStatus.FALSE_ALARM),
        SosStatus.ON_SITE,      Set.of(SosStatus.CLOSED, SosStatus.FALSE_ALARM),
        SosStatus.CLOSED,       Set.of(),
        SosStatus.FALSE_ALARM,  Set.of()
    );

    // ─── Création ────────────────────────────────────────────────────────────

    @Transactional
    public SosAlertDTO create(SosAlertDTO dto, Long actorId) {
        String clientRequestId = normalizeClientRequestId(dto.getClientRequestId());
        if (clientRequestId != null) {
            Optional<SosAlert> existing = alertRepo.findByClientRequestId(clientRequestId);
            if (existing.isPresent()) {
                SosAlert prior = existing.get();
                if (!prior.getCompanyId().equals(dto.getCompanyId())
                        || !prior.getEmployeeId().equals(dto.getEmployeeId())) {
                    throw new IllegalArgumentException("Clé d'idempotence SOS déjà utilisée");
                }
                return toDto(prior);
            }
        }
        SosAlert a = new SosAlert();
        a.setClientRequestId(clientRequestId);
        a.setCompanyId(dto.getCompanyId());
        a.setEmployeeId(dto.getEmployeeId());
        a.setReasonCode(dto.getReasonCode());
        a.setDescription(dto.getDescription());
        a.setLatitude(dto.getLatitude());
        a.setLongitude(dto.getLongitude());
        a.setGpsAccuracy(dto.getGpsAccuracy());
        a.setDrillMode(Boolean.TRUE.equals(dto.getDrillMode()));
        a.setStatus(SosStatus.RECEIVED);
        SosAlert saved = alertRepo.save(a);

        recordEvent(saved, null, SosStatus.RECEIVED, actorId, "Alerte SOS reçue");
        auditService.log(
            EmergencyAuditEventType.SOS_RECEIVED,
            actorId, saved.getCompanyId(),
            "SosAlert", saved.getId(),
            "{\"reason\":\"" + jsonEscape(dto.getReasonCode()) + "\",\"drill\":" + saved.getDrillMode() + "}",
            null, null
        );

        SosAlertDTO out = toDto(saved);
        broadcast(saved.getCompanyId(), saved.getId(), out);

        try {
            emergencyEmailService.notifySosCreated(
                    saved.getId(), null, dto.getReasonCode(),
                    dto.getDescription(), saved.getCompanyId());
        } catch (Exception e) {
            log.warn("Email notification failed for SOS#{}: {}", saved.getId(), e.getMessage());
        }

        return out;
    }

    // ─── Transitions ─────────────────────────────────────────────────────────

    @Transactional
    public SosAlertDTO acknowledge(Long id, Long actorId, SosTransitionRequest req) {
        return transition(id, SosStatus.ACKNOWLEDGED, actorId, req, (a, now) -> {
            a.setAcknowledgedAt(now);
            if (a.getCoordinatorId() == null && actorId != null) {
                a.setCoordinatorId(actorId);
            }
        }, EmergencyAuditEventType.SOS_ACKNOWLEDGED);
    }

    @Transactional
    public SosAlertDTO dispatch(Long id, Long actorId, SosTransitionRequest req) {
        return transition(id, SosStatus.DISPATCHED, actorId, req, (a, now) -> {
            a.setDispatchedAt(now);
            if (req != null && req.getRescueTeamId() != null) {
                a.setRescueTeamId(req.getRescueTeamId());
            }
        }, EmergencyAuditEventType.SOS_DISPATCHED);
    }

    @Transactional
    public SosAlertDTO onSite(Long id, Long actorId, SosTransitionRequest req) {
        return transition(id, SosStatus.ON_SITE, actorId, req, (a, now) -> {
            a.setOnSiteAt(now);
        }, EmergencyAuditEventType.SOS_ON_SITE);
    }

    @Transactional
    public SosAlertDTO close(Long id, Long actorId, SosTransitionRequest req) {
        return transition(id, SosStatus.CLOSED, actorId, req, (a, now) -> {
            a.setClosedAt(now);
        }, EmergencyAuditEventType.SOS_CLOSED);
    }

    @Transactional
    public SosAlertDTO falseAlarm(Long id, Long actorId, SosTransitionRequest req) {
        return transition(id, SosStatus.FALSE_ALARM, actorId, req, (a, now) -> {
            a.setClosedAt(now);
            if (req != null && req.getFalseAlarmReason() != null) {
                a.setFalseAlarmReason(req.getFalseAlarmReason());
            }
        }, EmergencyAuditEventType.SOS_FALSE_ALARM);
    }

    // ─── Helper transition générique ─────────────────────────────────────────

    private SosAlertDTO transition(
        Long id,
        SosStatus target,
        Long actorId,
        SosTransitionRequest req,
        java.util.function.BiConsumer<SosAlert, LocalDateTime> mutator,
        EmergencyAuditEventType auditEvent
    ) {
        SosAlert alert = alertRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("SOS introuvable : id=" + id));

        // Clôture terminale = décision d'un coordinateur (voir requireCoordinator).
        if (target == SosStatus.CLOSED || target == SosStatus.FALSE_ALARM) {
            requireCoordinator(actorId, alert.getCompanyId());
        }

        SosStatus current = alert.getStatus();
        if (!TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new IllegalStateException(
                "Transition non autorisée : " + current + " → " + target
            );
        }

        LocalDateTime now = LocalDateTime.now();
        mutator.accept(alert, now);
        alert.setStatus(target);
        SosAlert saved = alertRepo.save(alert);

        String note = req != null ? req.getNote() : null;
        recordEvent(saved, current, target, actorId, note);
        auditService.log(
            auditEvent,
            actorId, saved.getCompanyId(),
            "SosAlert", saved.getId(),
            "{\"from\":\"" + current + "\",\"to\":\"" + target + "\",\"note\":" + (note == null ? "null" : "\"" + jsonEscape(note) + "\"") + "}",
            null, null
        );

        SosAlertDTO out = toDto(saved);
        broadcast(saved.getCompanyId(), saved.getId(), out);
        return out;
    }

    private void recordEvent(SosAlert alert, SosStatus from, SosStatus to, Long actorId, String note) {
        SosLifecycleEvent evt = new SosLifecycleEvent();
        evt.setSosAlertId(alert.getId());
        evt.setStatusFrom(from);
        evt.setStatusTo(to);
        evt.setActorId(actorId);
        evt.setNote(note);
        eventRepo.save(evt);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────

    public List<SosAlertDTO> listActive(Long companyId) {
        return alertRepo.findByCompanyIdAndStatusNotInOrderByTriggeredAtDesc(
                companyId, List.of(SosStatus.CLOSED, SosStatus.FALSE_ALARM)
            ).stream()
            .map(this::toDto)
            .toList();
    }

    public List<SosAlertDTO> listAll(Long companyId) {
        return alertRepo.findByCompanyIdOrderByTriggeredAtDesc(companyId).stream()
            .map(this::toDto)
            .toList();
    }

    public Optional<SosAlertDTO> get(Long id) {
        return alertRepo.findById(id).map(this::toDto);
    }

    public List<SosLifecycleEventDTO> getLifecycle(Long alertId) {
        return eventRepo.findBySosAlertIdOrderByCreatedAtAsc(alertId).stream()
            .map(this::toEventDto)
            .toList();
    }

    // ─── Broadcast STOMP ─────────────────────────────────────────────────────

    private void broadcast(Long companyId, Long alertId, SosAlertDTO payload) {
        try {
            messaging.convertAndSend(
                "/topic/emergency/sos/company/" + companyId,
                payload
            );
            messaging.convertAndSend(
                "/topic/emergency/sos/" + alertId,
                payload
            );
        } catch (Exception e) {
            log.error("[SosAlertService] WebSocket broadcast failed for SOS#{}: {}", alertId, e.getMessage(), e);
        }
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private SosAlertDTO toDto(SosAlert a) {
        // Lookup nom équipe si présente
        String teamName = null;
        if (a.getRescueTeamId() != null) {
            teamName = teamRepo.findById(a.getRescueTeamId())
                .map(t -> t.getName())
                .orElse(null);
        }
        // Calcul durée écoulée (jusqu'à clôture si fermé, sinon jusqu'à maintenant)
        long elapsed = 0;
        if (a.getTriggeredAt() != null) {
            LocalDateTime end = a.getClosedAt() != null ? a.getClosedAt() : LocalDateTime.now();
            elapsed = Duration.between(a.getTriggeredAt(), end).getSeconds();
        } else {
            log.warn("SOS#{} has null triggeredAt — elapsed set to 0", a.getId());
        }

        return SosAlertDTO.builder()
            .id(a.getId())
            .clientRequestId(a.getClientRequestId())
            .companyId(a.getCompanyId())
            .employeeId(a.getEmployeeId())
            .coordinatorId(a.getCoordinatorId())
            .rescueTeamId(a.getRescueTeamId())
            .rescueTeamName(teamName)
            .reasonCode(a.getReasonCode())
            .description(a.getDescription())
            .latitude(a.getLatitude())
            .longitude(a.getLongitude())
            .gpsAccuracy(a.getGpsAccuracy())
            .status(a.getStatus())
            .drillMode(a.getDrillMode())
            .falseAlarmReason(a.getFalseAlarmReason())
            .triggeredAt(a.getTriggeredAt())
            .acknowledgedAt(a.getAcknowledgedAt())
            .dispatchedAt(a.getDispatchedAt())
            .onSiteAt(a.getOnSiteAt())
            .closedAt(a.getClosedAt())
            .elapsedSeconds(elapsed)
            .build();
    }

    private SosLifecycleEventDTO toEventDto(SosLifecycleEvent e) {
        return SosLifecycleEventDTO.builder()
            .id(e.getId())
            .sosAlertId(e.getSosAlertId())
            .statusFrom(e.getStatusFrom())
            .statusTo(e.getStatusTo())
            .actorId(e.getActorId())
            .note(e.getNote())
            .createdAt(e.getCreatedAt())
            .build();
    }

    private String jsonEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String normalizeClientRequestId(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
