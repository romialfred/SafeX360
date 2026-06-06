package com.minexpert.hns.api.emergency.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.EmergencyPermissionDTO;
import com.minexpert.hns.api.emergency.entity.EmergencyUserPermission;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.enums.EmergencyPermission;
import com.minexpert.hns.api.emergency.repository.EmergencyUserPermissionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service RBAC du module Urgences (LOT 48 Phase 1 — ADR-007).
 *
 * <p>Aucune touche au système d'auth global (JWT) : ce service expose une
 * couche complémentaire de permissions stockées dans la table dédiée
 * {@code emergency_user_permission}.</p>
 *
 * <p>Toutes les opérations grant/revoke sont journalisées via
 * {@link EmergencyAuditService}.</p>
 */
@Service
@RequiredArgsConstructor
public class EmergencyPermissionService {

    private final EmergencyUserPermissionRepository repository;
    private final EmergencyAuditService auditService;

    /** Toutes les permissions actives d'un utilisateur (tous scopes). */
    public List<EmergencyPermissionDTO> listActiveForUser(Long userId) {
        return repository.findActiveByUser(userId).stream().map(this::toDto).toList();
    }

    /** Permissions actives pour une mine donnée (global + scopées). */
    public List<EmergencyPermissionDTO> listActiveForUserOnCompany(Long userId, Long companyId) {
        return repository.findActiveByUserAndCompany(userId, companyId).stream().map(this::toDto).toList();
    }

    /** Tous les détenteurs actifs d'une permission sur une mine donnée. */
    public List<EmergencyPermissionDTO> listHolders(EmergencyPermission permission, Long companyId) {
        return repository.findActiveHolders(permission, companyId).stream().map(this::toDto).toList();
    }

    /** Test rapide : l'utilisateur a-t-il cette permission sur la mine ? */
    public boolean hasPermission(Long userId, EmergencyPermission permission, Long companyId) {
        return repository.findActiveMatch(userId, permission, companyId).isPresent();
    }

    /** Accorde une permission. Idempotent : ne re-crée pas si déjà active. */
    @Transactional
    public EmergencyPermissionDTO grant(Long userId,
                                         EmergencyPermission permission,
                                         Long companyId,
                                         Long grantedBy) {
        Optional<EmergencyUserPermission> existing = repository.findActiveMatch(userId, permission, companyId);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }
        EmergencyUserPermission p = new EmergencyUserPermission();
        p.setUserId(userId);
        p.setPermission(permission);
        p.setCompanyId(companyId);
        p.setGrantedBy(grantedBy);
        p.setGrantedAt(LocalDateTime.now());
        EmergencyUserPermission saved = repository.save(p);

        auditService.log(
            EmergencyAuditEventType.PERMISSION_GRANTED,
            grantedBy,
            companyId,
            "EmergencyUserPermission",
            saved.getId(),
            "{\"target\":" + userId + ",\"permission\":\"" + permission + "\"}",
            null,
            null
        );
        return toDto(saved);
    }

    /** Révoque une permission active. Soft delete via {@code revokedAt}. */
    @Transactional
    public Optional<EmergencyPermissionDTO> revoke(Long permissionId, Long revokedBy) {
        return repository.findById(permissionId).map(p -> {
            if (p.isActive()) {
                p.setRevokedAt(LocalDateTime.now());
                p.setRevokedBy(revokedBy);
                EmergencyUserPermission saved = repository.save(p);
                auditService.log(
                    EmergencyAuditEventType.PERMISSION_REVOKED,
                    revokedBy,
                    p.getCompanyId(),
                    "EmergencyUserPermission",
                    saved.getId(),
                    "{\"target\":" + p.getUserId() + ",\"permission\":\"" + p.getPermission() + "\"}",
                    null,
                    null
                );
                return toDto(saved);
            }
            return toDto(p);
        });
    }

    private EmergencyPermissionDTO toDto(EmergencyUserPermission p) {
        return EmergencyPermissionDTO.builder()
            .id(p.getId())
            .userId(p.getUserId())
            .permission(p.getPermission())
            .grantedBy(p.getGrantedBy())
            .grantedAt(p.getGrantedAt())
            .revokedAt(p.getRevokedAt())
            .revokedBy(p.getRevokedBy())
            .companyId(p.getCompanyId())
            .active(p.isActive())
            .build();
    }
}
