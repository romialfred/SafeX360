package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.Immutable;

import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Journal d'audit immuable du module Urgences (LOT 48 Phase 1 — ADR-008).
 *
 * <p>Conformité ISO 45001 §9.1.2 — conservation 5 ans (paramétrable dans
 * {@link EmergencySettings#getAuditRetentionYears()}).</p>
 *
 * <p><strong>Append-only :</strong> l'annotation {@link Immutable} verrouille
 * les UPDATE côté JPA. En complément, deux triggers MySQL (cf. migration
 * V001) interdisent UPDATE et DELETE au niveau base. Toute lecture passe par
 * {@code EmergencyAuditLogRepository}, jamais d'écriture sur instance
 * existante.</p>
 */
@Entity
@Immutable
@Table(
    name = "emergency_audit_log",
    indexes = {
        @Index(name = "idx_audit_actor",         columnList = "actor_id, created_at"),
        @Index(name = "idx_audit_type",          columnList = "event_type, created_at"),
        @Index(name = "idx_audit_entity",        columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_company_date",  columnList = "company_id, created_at")
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 60)
    private EmergencyAuditEventType eventType;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "company_id")
    private Long companyId;

    /** JSON contextuel. Stocké en LONGTEXT côté MySQL (le type JSON est mappé en String). */
    @Column(name = "payload_json", columnDefinition = "JSON")
    private String payloadJson;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
