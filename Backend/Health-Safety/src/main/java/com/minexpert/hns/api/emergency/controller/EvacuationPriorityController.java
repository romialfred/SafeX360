package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.EvacuationPriorityDTO;
import com.minexpert.hns.api.emergency.service.EvacuationPriorityService;

import lombok.RequiredArgsConstructor;

/**
 * Registre du personnel prioritaire à évacuer (VIP P1..P3).
 *
 * <p>Base : {@code /hns/emergency/priority}. Cloisonné par mine (companyId).</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/priority")
@RequiredArgsConstructor
public class EvacuationPriorityController {

    private final EvacuationPriorityService service;

    @GetMapping
    public ResponseEntity<List<EvacuationPriorityDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.list(companyId));
    }

    @PostMapping
    public ResponseEntity<EvacuationPriorityDTO> upsert(
        @Valid @RequestBody EvacuationPriorityDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.upsert(dto, actorId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.delete(id)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
