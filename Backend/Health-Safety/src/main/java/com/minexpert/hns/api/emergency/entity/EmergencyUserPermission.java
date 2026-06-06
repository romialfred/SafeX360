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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RBAC dédié au module Urgences (LOT 48 Phase 1 — ADR-007).
 *
 * <p>Table {@code emergency_user_permission}. Une permission peut être globale
 * (company_id = null) ou scopée à une mine. Le couple
 * (user_id, permission, company_id) est unique.</p>
 *
 * <p>Le champ {@code revokedAt} permet de garder la traçabilité d'une
 * révocation sans suppression physique — cohérent avec le journal d'audit
 * immuable (§4.1 prompt).</p>
 */
@Entity
@Table(
    name = "emergency_user_permission",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_emergency_perm",
        columnNames = {"user_id", "permission", "company_id"}
    ),
    indexes = {
        @Index(name = "idx_emergency_perm_user",    columnList = "user_id"),
        @Index(name = "idx_emergency_perm_company", columnList = "company_id")
    }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmergencyUserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false, length = 40)
    private EmergencyPermission permission;

    @Column(name = "granted_by")
    private Long grantedBy;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoked_by")
    private Long revokedBy;

    @Column(name = "company_id")
    private Long companyId;

    @PrePersist
    void onCreate() {
        if (this.grantedAt == null) {
            this.grantedAt = LocalDateTime.now();
        }
    }

    /** True si la permission n'a pas été révoquée. */
    public boolean isActive() {
        return revokedAt == null;
    }
}
