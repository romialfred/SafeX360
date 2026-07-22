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

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.error.CausalAnalysisDTO;
import com.minexpert.hns.dto.error.CauseDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentCauseService;

import lombok.RequiredArgsConstructor;

/**
 * Analyse causale structurée d'un incident (ISO 45001 §10.2 a-b) — modèle de
 * causes partagé avec le module Erreurs, rattaché ici à un incident.
 *
 * companyId optionnel : en vue consolidée l'intercepteur ne l'injecte pas ; le
 * service dérive/vérifie alors le cloisonnement via l'incident (source de vérité).
 */
@RestController
@RequestMapping("/incident-cause")
@CrossOrigin
@RequiredArgsConstructor
public class IncidentCauseAPI {

    private final IncidentCauseService incidentCauseService;

    @PostMapping("/incidents/{incidentId}/analyses")
    public ResponseEntity<CausalAnalysisDTO> addAnalysis(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId,
            @RequestBody CausalAnalysisDTO dto) throws HSException {
        return new ResponseEntity<>(incidentCauseService.addAnalysis(companyId, incidentId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/incidents/{incidentId}/analyses")
    public ResponseEntity<List<CausalAnalysisDTO>> listAnalyses(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId) throws HSException {
        return new ResponseEntity<>(incidentCauseService.listAnalyses(companyId, incidentId), HttpStatus.OK);
    }

    @GetMapping("/incidents/{incidentId}/causes")
    public ResponseEntity<List<CauseDTO>> listCausesByIncident(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId) throws HSException {
        return new ResponseEntity<>(incidentCauseService.listCausesByIncident(companyId, incidentId), HttpStatus.OK);
    }

    @PostMapping("/analyses/{analysisId}/causes")
    public ResponseEntity<CauseDTO> addCause(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long analysisId,
            @RequestBody CauseDTO dto) throws HSException {
        return new ResponseEntity<>(incidentCauseService.addCause(companyId, analysisId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/analyses/{analysisId}/causes")
    public ResponseEntity<List<CauseDTO>> listCauses(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long analysisId) throws HSException {
        return new ResponseEntity<>(incidentCauseService.listCauses(companyId, analysisId), HttpStatus.OK);
    }

    @DeleteMapping("/causes/{causeId}")
    public ResponseEntity<ResponseDTO> deleteCause(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long causeId) throws HSException {
        incidentCauseService.deleteCause(companyId, causeId);
        return new ResponseEntity<>(new ResponseDTO("Cause deleted successfully."), HttpStatus.OK);
    }
}
