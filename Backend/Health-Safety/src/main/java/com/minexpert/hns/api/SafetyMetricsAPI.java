package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import com.minexpert.hns.dto.IncidentInjuryDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.WorkedHoursDTO;
import com.minexpert.hns.dto.response.SafetyKpiDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.SafetyMetricsService;

import lombok.RequiredArgsConstructor;

/**
 * Classification des lésions + indicateurs de fréquence (ISO 45001 §9.1.1).
 * companyId optionnel : les lésions dérivent leur mine de l'incident ; les heures
 * travaillées et les KPI exigent une mine (le calcul consolidé accepte companyId nul).
 */
@RestController
@RequestMapping("/safety-metrics")
@CrossOrigin
@RequiredArgsConstructor
public class SafetyMetricsAPI {

    private final SafetyMetricsService safetyMetricsService;

    @PostMapping("/incidents/{incidentId}/injuries")
    public ResponseEntity<IncidentInjuryDTO> addInjury(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId,
            @RequestBody IncidentInjuryDTO dto) throws HSException {
        return new ResponseEntity<>(safetyMetricsService.addInjury(companyId, incidentId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/incidents/{incidentId}/injuries")
    public ResponseEntity<List<IncidentInjuryDTO>> listInjuries(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId) throws HSException {
        return new ResponseEntity<>(safetyMetricsService.listInjuries(companyId, incidentId), HttpStatus.OK);
    }

    @DeleteMapping("/injuries/{injuryId}")
    public ResponseEntity<ResponseDTO> deleteInjury(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long injuryId) throws HSException {
        safetyMetricsService.deleteInjury(companyId, injuryId);
        return new ResponseEntity<>(new ResponseDTO("Injury deleted successfully."), HttpStatus.OK);
    }

    @PutMapping("/worked-hours")
    public ResponseEntity<WorkedHoursDTO> upsertWorkedHours(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody WorkedHoursDTO dto) throws HSException {
        return new ResponseEntity<>(safetyMetricsService.upsertWorkedHours(companyId, dto), HttpStatus.OK);
    }

    @GetMapping("/worked-hours")
    public ResponseEntity<List<WorkedHoursDTO>> listWorkedHours(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam("year") int year) throws HSException {
        return new ResponseEntity<>(safetyMetricsService.listWorkedHours(companyId, year), HttpStatus.OK);
    }

    @GetMapping("/kpi")
    public ResponseEntity<SafetyKpiDTO> getKpi(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam("year") int year) {
        return new ResponseEntity<>(safetyMetricsService.computeKpi(companyId, year), HttpStatus.OK);
    }
}
