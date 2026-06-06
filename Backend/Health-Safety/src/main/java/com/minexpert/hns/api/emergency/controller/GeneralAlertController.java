package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.EvacuationCheckInDTO;
import com.minexpert.hns.api.emergency.dto.GeneralAlertDTO;
import com.minexpert.hns.api.emergency.dto.GeneralAlertRequest;
import com.minexpert.hns.api.emergency.enums.CheckInStatus;
import com.minexpert.hns.api.emergency.service.GeneralAlertService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints Alerte Générale + Évacuation Head-count (LOT 48 Phase 4).
 *
 * <p>Base : {@code /hns/emergency/alerts/general}.</p>
 */
@RestController
@RequestMapping("/emergency/alerts/general")
@RequiredArgsConstructor
public class GeneralAlertController {

    private final GeneralAlertService service;

    // ─── Lecture ─────────────────────────────────────────────────────────────

    /** Alerte active courante (ou 404 si aucune). */
    @GetMapping("/active")
    public ResponseEntity<GeneralAlertDTO> getActive(@RequestParam Long companyId) {
        return service.getActive(companyId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<GeneralAlertDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.list(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GeneralAlertDTO> get(@PathVariable Long id) {
        return service.get(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/check-ins")
    public ResponseEntity<List<EvacuationCheckInDTO>> checkIns(@PathVariable Long id) {
        return ResponseEntity.ok(service.getCheckIns(id));
    }

    // ─── Transitions ─────────────────────────────────────────────────────────

    @PostMapping("/trigger")
    public ResponseEntity<GeneralAlertDTO> trigger(
        @RequestBody GeneralAlertRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.trigger(req, actorId));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<GeneralAlertDTO> end(
        @PathVariable Long id,
        @RequestParam(required = false) Long actorId
    ) {
        return service.end(id, actorId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── Check-in ────────────────────────────────────────────────────────────

    @PostMapping("/{id}/check-in")
    public ResponseEntity<EvacuationCheckInDTO> checkIn(
        @PathVariable Long id,
        @RequestParam Long employeeId,
        @RequestParam(required = false) Long assemblyPointId,
        @RequestParam(required = false, defaultValue = "SAFE") CheckInStatus status,
        @RequestParam(required = false) Double latitude,
        @RequestParam(required = false) Double longitude,
        @RequestParam(required = false) Float gpsAccuracy,
        @RequestParam(required = false) String note,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.checkIn(
            id, employeeId, assemblyPointId, status,
            latitude, longitude, gpsAccuracy, note, actorId
        ));
    }
}
