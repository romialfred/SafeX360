package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.AssemblyPointDTO;
import com.minexpert.hns.api.emergency.dto.AssemblyPointHistoryDTO;
import com.minexpert.hns.api.emergency.service.AssemblyPointService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints Points de rassemblement (LOT 48 Phase 2).
 *
 * <p>Base : {@code /hns/emergency/assembly-points}. Soft-delete via archive
 * (préserve l'historique d'évacuations passées).</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/assembly-points")
@RequiredArgsConstructor
public class AssemblyPointController {

    private final AssemblyPointService service;

    @GetMapping
    public ResponseEntity<List<AssemblyPointDTO>> list(
        @RequestParam Long companyId,
        @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        return ResponseEntity.ok(service.list(companyId, includeArchived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssemblyPointDTO> get(@PathVariable Long id) {
        return service.get(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<AssemblyPointHistoryDTO>> history(@PathVariable Long id) {
        return ResponseEntity.ok(service.history(id));
    }

    @PostMapping
    public ResponseEntity<AssemblyPointDTO> create(
        @RequestBody AssemblyPointDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.create(dto, actorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssemblyPointDTO> update(
        @PathVariable Long id,
        @RequestBody AssemblyPointDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return service.update(id, dto, actorId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(
        @PathVariable Long id,
        @RequestParam(required = false) Long actorId
    ) {
        return service.archive(id, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
