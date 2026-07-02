package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.EmergencyMediaDTO;
import com.minexpert.hns.api.emergency.service.EmergencyMediaService;

import lombok.RequiredArgsConstructor;

/** Endpoints médias d'urgence (LOT 48 Phase 1.e). Base : {@code /hns/emergency/media}. */
@RestController
@CrossOrigin
@RequestMapping("/emergency/media")
@RequiredArgsConstructor
public class EmergencyMediaController {

    private final EmergencyMediaService service;

    @GetMapping
    public ResponseEntity<List<EmergencyMediaDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.list(companyId));
    }

    @PostMapping
    public ResponseEntity<EmergencyMediaDTO> create(@RequestBody EmergencyMediaDTO dto,
                                                     @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.create(dto, actorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmergencyMediaDTO> update(@PathVariable Long id,
                                                     @RequestBody EmergencyMediaDTO dto,
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
