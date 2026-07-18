package com.minexpert.hns.api.emergency.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.minexpert.hns.api.emergency.dto.EmergencySettingsDTO;
import com.minexpert.hns.api.emergency.service.EmergencySettingsService;
import com.minexpert.hns.config.CompanyScopeGuard;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST des paramètres Urgences par mine (LOT 48 Phase 1).
 *
 * <p>Path base hérité : {@code /hns/emergency/settings} (le préfixe {@code /hns}
 * vient du context-path Spring Boot du microservice Health-Safety).</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/settings")
@RequiredArgsConstructor
public class EmergencySettingsController {

    private final EmergencySettingsService service;
    private final CompanyScopeGuard companyScopeGuard;

    /**
     * GET /hns/emergency/settings/{companyId} — récupère (ou initialise).
     *
     * <p>La mine arrive ici en VARIABLE DE CHEMIN : le CompanyScopeFilter, qui ne
     * contrôle que le paramètre de requête {@code companyId}, ne la voyait pas —
     * n'importe quel utilisateur authentifié pouvait donc lire les réglages
     * d'urgence d'une autre mine. D'où la garde explicite.</p>
     */
    @GetMapping("/{companyId}")
    public ResponseEntity<EmergencySettingsDTO> get(@PathVariable Long companyId) {
        companyScopeGuard.assertInScope(companyId);
        return ResponseEntity.ok(service.getOrCreate(companyId));
    }

    /**
     * PUT /hns/emergency/settings — met à jour les settings.
     *
     * <p>Ici la mine arrive dans le CORPS : même angle mort du filtre, en
     * ÉCRITURE cette fois (on pouvait désactiver les réglages d'urgence d'une
     * autre mine — d'où la priorité donnée à ce point).</p>
     */
    @PutMapping
    public ResponseEntity<EmergencySettingsDTO> update(@Valid @RequestBody EmergencySettingsDTO dto,
                                                       @RequestParam(required = false) Long actorId) {
        companyScopeGuard.assertInScope(dto.getCompanyId());
        return ResponseEntity.ok(service.update(dto, actorId));
    }
}
