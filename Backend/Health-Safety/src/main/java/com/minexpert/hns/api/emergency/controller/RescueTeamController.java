package com.minexpert.hns.api.emergency.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.api.emergency.dto.RescueShiftDTO;
import com.minexpert.hns.api.emergency.dto.RescueTeamDTO;
import com.minexpert.hns.api.emergency.dto.RescueTeamMemberDTO;
import com.minexpert.hns.api.emergency.service.RescueTeamService;

import lombok.RequiredArgsConstructor;

/** Endpoints équipes/membres/shifts (LOT 48 Phase 1.c). Base : {@code /hns/emergency/teams}. */
@RestController
@RequestMapping("/emergency/teams")
@RequiredArgsConstructor
public class RescueTeamController {

    private final RescueTeamService service;

    // ── Teams ──
    @GetMapping
    public ResponseEntity<List<RescueTeamDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.listTeams(companyId));
    }

    @PostMapping
    public ResponseEntity<RescueTeamDTO> create(@RequestBody RescueTeamDTO dto,
                                                 @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.createTeam(dto, actorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RescueTeamDTO> update(@PathVariable Long id,
                                                 @RequestBody RescueTeamDTO dto,
                                                 @RequestParam(required = false) Long actorId) {
        return service.updateTeam(id, dto, actorId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @RequestParam(required = false) Long actorId) {
        return service.deleteTeam(id, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }

    // ── Members ──
    @GetMapping("/{id}/members")
    public ResponseEntity<List<RescueTeamMemberDTO>> listMembers(@PathVariable Long id) {
        return ResponseEntity.ok(service.listMembers(id));
    }

    @PostMapping("/members")
    public ResponseEntity<RescueTeamMemberDTO> addMember(@RequestBody RescueTeamMemberDTO dto,
                                                          @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.addMember(dto, actorId));
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long memberId,
                                              @RequestParam(required = false) Long actorId) {
        return service.removeMember(memberId, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }

    // ── Shifts ──
    @GetMapping("/{id}/shifts")
    public ResponseEntity<List<RescueShiftDTO>> listShifts(@PathVariable Long id) {
        return ResponseEntity.ok(service.listShifts(id));
    }

    @PostMapping("/shifts")
    public ResponseEntity<RescueShiftDTO> createShift(@RequestBody RescueShiftDTO dto,
                                                       @RequestParam(required = false) Long actorId) {
        return ResponseEntity.ok(service.createShift(dto, actorId));
    }

    @DeleteMapping("/shifts/{shiftId}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long shiftId,
                                             @RequestParam(required = false) Long actorId) {
        return service.deleteShift(shiftId, actorId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
