package com.minexpert.hns.api.emergency.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.RescueWeeklyPlanningDTO;
import com.minexpert.hns.api.emergency.service.RescueWeeklyPlanningService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints planification hebdomadaire d'urgence (LOT 48 Phase 1.c.2).
 *
 * <p>Base : {@code /hns/emergency/planning}. Pattern d'upsert : un seul endpoint
 * {@code PUT} crée OU met à jour selon l'existence d'une entrée pour la semaine.</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/planning")
@RequiredArgsConstructor
public class RescueWeeklyPlanningController {

    private final RescueWeeklyPlanningService service;

    @GetMapping
    public ResponseEntity<List<RescueWeeklyPlanningDTO>> list(
        @RequestParam Long companyId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        if (from != null && to != null) {
            return ResponseEntity.ok(service.listBetween(companyId, from, to));
        }
        return ResponseEntity.ok(service.listForCompany(companyId));
    }

    @GetMapping("/week")
    public ResponseEntity<RescueWeeklyPlanningDTO> getWeek(
        @RequestParam Long companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate
    ) {
        return service.getForWeek(companyId, weekStartDate)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Upsert : crée si la semaine n'existe pas, met à jour sinon. */
    @PutMapping
    public ResponseEntity<RescueWeeklyPlanningDTO> upsert(
        @RequestBody RescueWeeklyPlanningDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.upsert(dto, actorId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable Long id,
        @RequestParam(required = false) Long actorId
    ) {
        return service.delete(id, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
