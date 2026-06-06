package com.minexpert.hns.api.emergency.entity;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.EmergencyPermission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Règle d'escalade SOS (LOT 48 Phase 1.d). */
@Entity
@Table(
    name = "escalation_rule",
    indexes = @Index(name = "idx_esc_company", columnList = "company_id, step_order")
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EscalationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    /** Cible explicite (un Employee.id) — alternatif à {@link #targetPermission}. */
    @Column(name = "target_user_id")
    private Long targetUserId;

    /** Cible par rôle (COORDINATOR / RESPONDER / ALERT_LAUNCHER). */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_permission", length = 40)
    private EmergencyPermission targetPermission;

    @Column(name = "delay_seconds", nullable = false)
    private Integer delaySeconds = 60;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
