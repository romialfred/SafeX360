package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.SosStatus;

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
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/**
 * Événement immuable du cycle de vie d'un SOS (LOT 48 Phase 3.a).
 *
 * <p>Une ligne par transition d'état + snapshot des contexts (acteur, raison,
 * notes). Sert de timeline UI + preuve ISO 45001 §9.1.2 (rétention 5 ans).</p>
 */
@Entity
@Immutable
@Table(
    name = "sos_lifecycle_event",
    indexes = {
        @Index(name = "idx_sos_evt_alert", columnList = "sos_alert_id"),
        @Index(name = "idx_sos_evt_at",    columnList = "created_at")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SosLifecycleEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sos_alert_id", nullable = false)
    private Long sosAlertId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_to", nullable = false, length = 20)
    private SosStatus statusTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_from", length = 20)
    private SosStatus statusFrom;

    /** Acteur ayant déclenché la transition (NULL = système). */
    @Column(name = "actor_id")
    private Long actorId;

    /** Note libre attachée à la transition (raison, commentaire). */
    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
