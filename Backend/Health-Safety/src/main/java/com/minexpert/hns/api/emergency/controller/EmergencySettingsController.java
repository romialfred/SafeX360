package com.minexpert.hns.api.emergency.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.api.emergency.dto.EmergencySettingsDTO;
import com.minexpert.hns.api.emergency.service.EmergencySettingsService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST des paramètres Urgences par mine (LOT 48 Phase 1).
 *
 * <p>Path base hérité : {@code /hns/emergency/settings} (le préfixe {@code /hns}
 * vient du context-path Spring Boot du microservice Health-Safety).</p>
 */
@RestController
@RequestMapping("/emergency/settings")
@RequiredArgsConstructor
public class EmergencySettingsController {

    private final EmergencySettingsService service;

    /** GET /hns/emergency/settings/{companyId} — récupère (ou initialise). */
    @GetMapping("/{companyId}")
    public ResponseEntity<EmergencySettingsDTO> get(@PathVariable Long companyId) {
        return ResponseEntity.ok(service.getOrCreate(companyId));
    }

    /** PUT /hns/emergency/settings — met à jour les settings. */
    @PutMapping
    public ResponseEntity<EmergencySettingsDTO> update(@RequestBody EmergencySettingsDTO dto,
                                                       @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.update(dto, actorId));
    }
}
