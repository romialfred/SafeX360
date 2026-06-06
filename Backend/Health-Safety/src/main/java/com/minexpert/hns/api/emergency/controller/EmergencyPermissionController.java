package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.api.emergency.dto.EmergencyPermissionDTO;
import com.minexpert.hns.api.emergency.enums.EmergencyPermission;
import com.minexpert.hns.api.emergency.service.EmergencyPermissionService;

import lombok.RequiredArgsConstructor;

/** Endpoints RBAC Urgences (LOT 48 Phase 1). Path base : {@code /hns/emergency/permissions}. */
@RestController
@RequestMapping("/emergency/permissions")
@RequiredArgsConstructor
public class EmergencyPermissionController {

    private final EmergencyPermissionService service;

    /** GET /hns/emergency/permissions/user/{userId} — toutes permissions actives d'un user. */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<EmergencyPermissionDTO>> listForUser(@PathVariable Long userId,
                                                                    @RequestParam(required = false) Long companyId) {
        if (companyId == null) {
            return ResponseEntity.ok(service.listActiveForUser(userId));
        }
        return ResponseEntity.ok(service.listActiveForUserOnCompany(userId, companyId));
    }

    /** GET /hns/emergency/permissions/holders — liste tous les détenteurs d'une permission. */
    @GetMapping("/holders")
    public ResponseEntity<List<EmergencyPermissionDTO>> listHolders(@RequestParam EmergencyPermission permission,
                                                                     @RequestParam Long companyId) {
        return ResponseEntity.ok(service.listHolders(permission, companyId));
    }

    /** POST /hns/emergency/permissions/grant — accorde une permission. */
    @PostMapping("/grant")
    public ResponseEntity<EmergencyPermissionDTO> grant(@RequestBody EmergencyPermissionDTO dto,
                                                         @RequestParam Long grantedBy) {
        return ResponseEntity.ok(service.grant(dto.getUserId(), dto.getPermission(), dto.getCompanyId(), grantedBy));
    }

    /** DELETE /hns/emergency/permissions/{id} — révoque (soft delete). */
    @DeleteMapping("/{id}")
    public ResponseEntity<EmergencyPermissionDTO> revoke(@PathVariable Long id,
                                                          @RequestParam Long revokedBy) {
        return service.revoke(id, revokedBy)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
