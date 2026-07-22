package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.InvestigationTimelineEventDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.WitnessStatementDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.InvestigationGovernanceService;

import lombok.RequiredArgsConstructor;

/**
 * Gouvernance d'enquête (ISO 45001 §10.2) — frise chronologique (ECFC) et
 * témoignages structurés. companyId optionnel = vue consolidée (cloisonnement
 * appliqué au service via l'enquête parente).
 */
@RestController
@RequestMapping("/investigation-governance")
@CrossOrigin
@RequiredArgsConstructor
public class InvestigationGovernanceAPI {

    private final InvestigationGovernanceService service;

    // ── Frise chronologique ──────────────────────────────────────────────────

    @PostMapping("/investigations/{investigationId}/timeline")
    public ResponseEntity<InvestigationTimelineEventDTO> addTimelineEvent(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long investigationId,
            @RequestBody InvestigationTimelineEventDTO dto) throws HSException {
        return new ResponseEntity<>(service.addTimelineEvent(companyId, investigationId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/investigations/{investigationId}/timeline")
    public ResponseEntity<List<InvestigationTimelineEventDTO>> listTimeline(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long investigationId) throws HSException {
        return new ResponseEntity<>(service.listTimelineEvents(companyId, investigationId), HttpStatus.OK);
    }

    @DeleteMapping("/timeline/{eventId}")
    public ResponseEntity<ResponseDTO> deleteTimelineEvent(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long eventId) throws HSException {
        service.deleteTimelineEvent(companyId, eventId);
        return new ResponseEntity<>(new ResponseDTO("Timeline event deleted successfully."), HttpStatus.OK);
    }

    // ── Témoignages ──────────────────────────────────────────────────────────

    @PostMapping("/investigations/{investigationId}/witnesses")
    public ResponseEntity<WitnessStatementDTO> addWitness(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long investigationId,
            @RequestBody WitnessStatementDTO dto) throws HSException {
        return new ResponseEntity<>(service.addWitnessStatement(companyId, investigationId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/investigations/{investigationId}/witnesses")
    public ResponseEntity<List<WitnessStatementDTO>> listWitnesses(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long investigationId) throws HSException {
        return new ResponseEntity<>(service.listWitnessStatements(companyId, investigationId), HttpStatus.OK);
    }

    @DeleteMapping("/witnesses/{statementId}")
    public ResponseEntity<ResponseDTO> deleteWitness(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long statementId) throws HSException {
        service.deleteWitnessStatement(companyId, statementId);
        return new ResponseEntity<>(new ResponseDTO("Witness statement deleted successfully."), HttpStatus.OK);
    }
}
