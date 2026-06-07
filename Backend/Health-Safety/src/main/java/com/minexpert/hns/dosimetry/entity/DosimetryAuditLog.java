package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Journal d'audit du module Dosimetrie (tracabilite RGPD et reglementaire).
 *
 * <p><b>APPEND-ONLY :</b> aucune modification ni suppression apres insertion.
 * L'immutabilite est garantie cote base par des triggers MySQL BEFORE UPDATE / BEFORE DELETE
 * qui bloquent toute mutation (SIGNAL SQLSTATE '45000'). Toutes les colonnes sont marquees
 * updatable=false par defense en profondeur cote JPA.
 *
 * <p>action : CREATE | READ | UPDATE | VIEW_NOMINATIVE_DOSE | EXPORT
 * <p>details : payload JSON libre (champs modifies, parametres d'export, etc.).
 */
@Entity
@Table(name = "dosimetry_audit_log",
        indexes = {
                @Index(name = "idx_audit_user_ts", columnList = "user_id, timestamp"),
                @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_audit_action", columnList = "action")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DosimetryAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action", nullable = false, updatable = false, length = 64)
    private String action;

    @Column(name = "entity_type", nullable = false, updatable = false, length = 128)
    private String entityType;

    @Column(name = "entity_id", updatable = false)
    private Long entityId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "user_permissions", updatable = false, length = 1024)
    private String userPermissions;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address", updatable = false, length = 64)
    private String ipAddress;

    @Column(name = "details", updatable = false, columnDefinition = "TEXT")
    private String details;
}
