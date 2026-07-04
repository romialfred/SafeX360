package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.dto.error.ErrorClassificationDTO;
import com.minexpert.hns.dto.error.ErrorEventDTO;
import com.minexpert.hns.dto.error.ErrorEventHistoryDTO;
import com.minexpert.hns.dto.error.ErrorKpiDTO;
import com.minexpert.hns.dto.error.JustCultureAssessmentDTO;
import com.minexpert.hns.dto.error.StatusUpdateRequest;
import com.minexpert.hns.enums.ErrorEventStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.error.ErrorEventService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints du module Gestion des Erreurs.
 *
 * Path base : {@code /hns/error} (le context-path {@code /hns} est applique par
 * le service). Les GET sont accessibles a tout utilisateur authentifie ; les
 * POST/PUT/DELETE sont reserves aux administrateurs (ou appels internes du
 * gateway) via {@link ErrorRbacGuard}.
 */
@RestController
@RequestMapping("/error")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class ErrorEventAPI {

    private final ErrorEventService errorEventService;
    private final ErrorRbacGuard rbacGuard;

    // ─── Evenement erreur ────────────────────────────────────────────────────

    @PostMapping("/events")
    public ResponseEntity<ErrorEventDTO> create(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody ErrorEventDTO dto,
            HttpServletRequest request) throws HSException {
        // §6 — Declarant = tout collaborateur : la declaration est ouverte a tout
        // utilisateur authentifie (la qualification/analyse/cloture restent admin).
        rbacGuard.requireAuthenticated(request);
        return new ResponseEntity<>(errorEventService.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/events/{id}/status")
    public ResponseEntity<ErrorEventDTO> updateStatus(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest body,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        return new ResponseEntity<>(errorEventService.updateStatus(companyId, id, body), HttpStatus.OK);
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ErrorEventDTO> getById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(errorEventService.getById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/events")
    public ResponseEntity<List<ErrorEventDTO>> list(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @RequestParam(name = "status", required = false) ErrorEventStatus status,
            @RequestParam(name = "eventTypeId", required = false) Long eventTypeId) throws HSException {
        return new ResponseEntity<>(errorEventService.list(companyId, status, eventTypeId), HttpStatus.OK);
    }

    @GetMapping("/events/{id}/history")
    public ResponseEntity<List<ErrorEventHistoryDTO>> getHistory(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(errorEventService.getHistory(companyId, id), HttpStatus.OK);
    }

    // ─── Classification ──────────────────────────────────────────────────────

    @PutMapping("/events/{id}/classification")
    public ResponseEntity<ErrorClassificationDTO> upsertClassification(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long id,
            @RequestBody ErrorClassificationDTO dto,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        return new ResponseEntity<>(errorEventService.upsertClassification(companyId, id, dto), HttpStatus.OK);
    }

    @GetMapping("/events/{id}/classification")
    public ResponseEntity<ErrorClassificationDTO> getClassification(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(errorEventService.getClassification(companyId, id), HttpStatus.OK);
    }

    // ─── Analyse causale + causes ──────────────────────────────────────────────

    @PostMapping("/events/{id}/causal-analyses")
    public ResponseEntity<CausalAnalysisDTO> addCausalAnalysis(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long id,
            @RequestBody CausalAnalysisDTO dto,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        return new ResponseEntity<>(errorEventService.addCausalAnalysis(companyId, id, dto), HttpStatus.CREATED);
    }

    @GetMapping("/events/{id}/causal-analyses")
    public ResponseEntity<List<CausalAnalysisDTO>> listCausalAnalyses(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(errorEventService.listCausalAnalyses(companyId, id), HttpStatus.OK);
    }

    @PostMapping("/causal-analyses/{analysisId}/causes")
    public ResponseEntity<CauseDTO> addCause(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long analysisId,
            @RequestBody CauseDTO dto,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        return new ResponseEntity<>(errorEventService.addCause(companyId, analysisId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/causal-analyses/{analysisId}/causes")
    public ResponseEntity<List<CauseDTO>> listCauses(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long analysisId) throws HSException {
        return new ResponseEntity<>(errorEventService.listCauses(companyId, analysisId), HttpStatus.OK);
    }

    @DeleteMapping("/causes/{causeId}")
    public ResponseEntity<ResponseDTO> deleteCause(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long causeId,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        errorEventService.deleteCause(companyId, causeId);
        return new ResponseEntity<>(new ResponseDTO("Cause supprimee avec succes."), HttpStatus.OK);
    }

    // ─── Culture juste (Just Culture) ───────────────────────────────────────────

    @PutMapping("/events/{id}/just-culture")
    public ResponseEntity<JustCultureAssessmentDTO> upsertJustCulture(
            @RequestParam("companyId") Long companyId,
            @PathVariable Long id,
            @RequestBody JustCultureAssessmentDTO dto,
            HttpServletRequest request) throws HSException {
        rbacGuard.requireAdminOrInternal(request);
        return new ResponseEntity<>(errorEventService.upsertJustCulture(companyId, id, dto), HttpStatus.OK);
    }

    @GetMapping("/events/{id}/just-culture")
    public ResponseEntity<JustCultureAssessmentDTO> getJustCulture(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(errorEventService.getJustCulture(companyId, id), HttpStatus.OK);
    }

    // ─── KPI ─────────────────────────────────────────────────────────────────

    @GetMapping("/kpis")
    public ResponseEntity<ErrorKpiDTO> kpis(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(errorEventService.computeKpis(companyId), HttpStatus.OK);
    }
}
