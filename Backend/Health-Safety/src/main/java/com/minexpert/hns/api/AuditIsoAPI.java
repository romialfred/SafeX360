package com.minexpert.hns.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.audit.EffectivenessCheckDTO;
import com.minexpert.hns.dto.audit.MeetingDTO;
import com.minexpert.hns.dto.audit.ValidateTeamRequest;
import com.minexpert.hns.dto.audit.ValidateTeamResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditOwnershipGuard;
import com.minexpert.hns.service.audit.EffectivenessService;
import com.minexpert.hns.service.audit.MeetingService;
import com.minexpert.hns.service.audit.ObservationService;
import com.minexpert.hns.service.audit.TeamValidationService;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Endpoints ISO 19011 transverses du module Audits :
 * validation d'équipe (§5.4.4/§7), réunions d'ouverture et de clôture (§6.4),
 * escalade des NC vers les Constats centraux, vérification d'efficacité (§6.6).
 */
@RestController
@RequestMapping("/audit-iso")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditIsoAPI {

    private final TeamValidationService teamValidationService;
    private final MeetingService meetingService;
    private final ObservationService observationService;
    private final EffectivenessService effectivenessService;
    private final AuditOwnershipGuard auditOwnershipGuard;

    // ─── Équipe d'audit : lead qualifié + indépendance + certifications ───

    @PostMapping("/validate-team")
    public ResponseEntity<ValidateTeamResponse> validateTeam(@RequestBody ValidateTeamRequest request)
            throws HSException {
        return new ResponseEntity<>(teamValidationService.validateTeam(request), HttpStatus.OK);
    }

    // ─── Réunions d'ouverture / clôture ───

    @PostMapping("/{auditId}/meetings")
    public ResponseEntity<Long> createMeeting(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId,
            @RequestBody MeetingDTO meetingDTO) throws HSException {
        meetingDTO.setAuditId(auditId);
        // Cloisonnement par mine : la réunion hérite du companyId de la mine active.
        if (companyId != null) {
            meetingDTO.setCompanyId(companyId);
        }
        return new ResponseEntity<>(meetingService.createMeeting(meetingDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{auditId}/meetings")
    public ResponseEntity<List<MeetingDTO>> getMeetings(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse les réunions d'un audit d'une autre mine.
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(meetingService.getMeetingsByAuditId(auditId), HttpStatus.OK);
    }

    // ─── Escalade d'un constat NC vers les Constats centraux ───

    @PostMapping("/observations/{id}/escalate")
    public ResponseEntity<Map<String, Object>> escalateObservation(@PathVariable Long id) throws HSException {
        Long ncId = observationService.escalateToNonConformity(id);
        return new ResponseEntity<>(Map.of(
                "nonConformityId", ncId,
                "message", "Constat escaladé vers les Constats centraux"
        ), HttpStatus.CREATED);
    }

    // ─── Vérification d'efficacité (ISO §6.6) ───

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanCheckRequest {
        private LocalDate dueDate;
        private Long evaluatorEmployeeId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerdictRequest {
        /** EFFICACE / PARTIELLEMENT_EFFICACE / INEFFICACE */
        private String verdict;
        private String comment;
    }

    @PostMapping("/recommendations/{id}/effectiveness")
    public ResponseEntity<Long> planEffectivenessCheck(@PathVariable Long id,
            @RequestBody PlanCheckRequest request) throws HSException {
        return new ResponseEntity<>(
                effectivenessService.planCheck(id, request.getDueDate(), request.getEvaluatorEmployeeId()),
                HttpStatus.CREATED);
    }

    @PutMapping("/effectiveness/{id}")
    public ResponseEntity<ResponseDTO> concludeEffectivenessCheck(@PathVariable Long id,
            @RequestBody VerdictRequest request) throws HSException {
        effectivenessService.concludeCheck(id, request.getVerdict(), request.getComment());
        return new ResponseEntity<>(new ResponseDTO("Verdict d'efficacité enregistré"), HttpStatus.OK);
    }

    @GetMapping("/effectiveness/pending")
    public ResponseEntity<List<EffectivenessCheckDTO>> getPendingChecks(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(effectivenessService.getPendingChecks(companyId), HttpStatus.OK);
    }

    @GetMapping("/recommendations/{id}/effectiveness")
    public ResponseEntity<List<EffectivenessCheckDTO>> getChecksByRecommendation(@PathVariable Long id)
            throws HSException {
        return new ResponseEntity<>(effectivenessService.getChecksByRecommendation(id), HttpStatus.OK);
    }
}
