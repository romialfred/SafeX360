package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.entity.EmergencyAuditLog;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.repository.EmergencyAuditLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service d'écriture du journal d'audit immuable (LOT 48 Phase 1 — ADR-008).
 *
 * <p>Toutes les écritures sont {@code REQUIRES_NEW} : un échec applicatif ne
 * compromet pas la trace d'audit. Une exception levée par le repo est
 * journalisée mais <strong>ne casse pas la transaction parente</strong>.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyAuditService {

    private final EmergencyAuditLogRepository repository;

    /** Crée une entrée d'audit (append-only). Ne lève jamais d'exception. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(EmergencyAuditEventType type,
                    Long actorId,
                    Long companyId,
                    String entityType,
                    Long entityId,
                    String payloadJson,
                    String ipAddress,
                    String userAgent) {
        try {
            EmergencyAuditLog entry = EmergencyAuditLog.builder()
                .eventType(type)
                .actorId(actorId)
                .companyId(companyId)
                .entityType(entityType)
                .entityId(entityId)
                .payloadJson(payloadJson)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();
            repository.save(entry);
        } catch (Exception e) {
            // Le journal d'audit ne doit jamais casser un flux métier.
            log.error("[emergency-audit] failed to write log entry type={} actor={} company={} entity={}/{} :: {}",
                type, actorId, companyId, entityType, entityId, e.getMessage(), e);
        }
    }

    /** Variante courte : type seul + actor. */
    public void log(EmergencyAuditEventType type, Long actorId, Long companyId) {
        log(type, actorId, companyId, null, null, null, null, null);
    }
}
