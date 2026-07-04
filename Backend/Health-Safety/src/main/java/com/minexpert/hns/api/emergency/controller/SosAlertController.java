package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.SosAlertDTO;
import com.minexpert.hns.api.emergency.dto.SosLifecycleEventDTO;
import com.minexpert.hns.api.emergency.dto.SosTransitionRequest;
import com.minexpert.hns.api.emergency.service.SosAlertService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints SOS Lifecycle (LOT 48 Phase 3.a).
 *
 * <p>Base : {@code /hns/emergency/sos}. Pattern transition POST /{id}/{action}
 * pour rester en accord avec les verbes métier (acknowledge, dispatch, on-site,
 * close, false-alarm).</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/sos")
@RequiredArgsConstructor
public class SosAlertController {

    private final SosAlertService service;

    // ─── Lecture ─────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<SosAlertDTO>> list(
        @RequestParam Long companyId,
        @RequestParam(defaultValue = "false") boolean includeClosed
    ) {
        return ResponseEntity.ok(
            includeClosed ? service.listAll(companyId) : service.listActive(companyId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<SosAlertDTO> get(@PathVariable Long id) {
        return service.get(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/lifecycle")
    public ResponseEntity<List<SosLifecycleEventDTO>> lifecycle(@PathVariable Long id) {
        return ResponseEntity.ok(service.getLifecycle(id));
    }

    // ─── Création ────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<SosAlertDTO> create(
        @Valid @RequestBody SosAlertDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.create(dto, actorId));
    }

    // ─── Transitions ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<SosAlertDTO> acknowledge(
        @PathVariable Long id,
        @RequestBody(required = false) SosTransitionRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.acknowledge(id, actorId, req));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<SosAlertDTO> dispatch(
        @PathVariable Long id,
        @RequestBody(required = false) SosTransitionRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.dispatch(id, actorId, req));
    }

    @PostMapping("/{id}/on-site")
    public ResponseEntity<SosAlertDTO> onSite(
        @PathVariable Long id,
        @RequestBody(required = false) SosTransitionRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.onSite(id, actorId, req));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<SosAlertDTO> close(
        @PathVariable Long id,
        @RequestBody(required = false) SosTransitionRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.close(id, actorId, req));
    }

    @PostMapping("/{id}/false-alarm")
    public ResponseEntity<SosAlertDTO> falseAlarm(
        @PathVariable Long id,
        @RequestBody(required = false) SosTransitionRequest req,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.falseAlarm(id, actorId, req));
    }
}
