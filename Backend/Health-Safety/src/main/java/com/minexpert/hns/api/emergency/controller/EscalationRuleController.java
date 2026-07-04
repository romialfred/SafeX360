package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.EscalationRuleDTO;
import com.minexpert.hns.api.emergency.service.EscalationRuleService;

import lombok.RequiredArgsConstructor;

/** Endpoints règles d'escalade (LOT 48 Phase 1.d). Base : {@code /hns/emergency/escalation}. */
@RestController
@CrossOrigin
@RequestMapping("/emergency/escalation")
@RequiredArgsConstructor
public class EscalationRuleController {

    private final EscalationRuleService service;

    @GetMapping
    public ResponseEntity<List<EscalationRuleDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.list(companyId));
    }

    @PostMapping
    public ResponseEntity<EscalationRuleDTO> create(@Valid @RequestBody EscalationRuleDTO dto,
                                                     @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.create(dto, actorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EscalationRuleDTO> update(@PathVariable Long id,
                                                     @Valid @RequestBody EscalationRuleDTO dto,
                                                     @RequestParam(required = false) Long actorId) {
        return service.update(id, dto, actorId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @RequestParam(required = false) Long actorId) {
        return service.delete(id, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
