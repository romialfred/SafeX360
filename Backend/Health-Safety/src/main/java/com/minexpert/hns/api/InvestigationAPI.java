package com.minexpert.hns.api;

import java.util.List;

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

import com.minexpert.hns.dto.InvestActionDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.InvestigationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/incident-investigation")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class InvestigationAPI {
    private final InvestigationService investigationService;

    // companyId optionnel : quand l'UI est en vue consolidee « Toutes les Mines »,
    // l'intercepteur n'injecte pas companyId ; le service le derive alors de
    // l'incident (source de verite). Evite le 400 « parametre companyId manquant ».
    @PostMapping("/create")
    public ResponseEntity<Long> createInvestigation(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody InvestActionDTO request) throws HSException {
        return new ResponseEntity<>(investigationService.addInvestigation(companyId, request), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateInvestigation(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestBody InvestActionDTO request) throws HSException {
        investigationService.updateInvestigation(companyId, request);
        return new ResponseEntity<>(new ResponseDTO("Investigation updated successfully."), HttpStatus.OK);
    }

    /**
     * Validation par un pair indépendant (ISO 45001 §10.2) — prérequis à la clôture.
     * RACI : réservé aux rôles « Accountable » (coordinateur/manager HSE + admins)
     * via l'autorité {@link com.minexpert.hns.config.IncidentRbacConfig#INCIDENT_VALIDATE}.
     * L'indépendance vis-à-vis de l'équipe d'enquête est vérifiée en plus côté service.
     */
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAuthority('" + com.minexpert.hns.config.IncidentRbacConfig.INCIDENT_VALIDATE + "')")
    @PutMapping("/{id}/validate")
    public ResponseEntity<ResponseDTO> validateInvestigation(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @jakarta.validation.Valid @RequestBody(required = false) com.minexpert.hns.dto.ValidationRequest body)
            throws HSException {
        String comment = body != null ? body.getComment() : null;
        investigationService.validateInvestigation(companyId, id, comment);
        return new ResponseEntity<>(new ResponseDTO("Investigation validated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getByIncidentId/{incidentId}")
    public ResponseEntity<InvestResponse> getInvestigationByIncidentId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId)
            throws HSException {
        return new ResponseEntity<>(investigationService.getInvestigationByIncidentId(companyId, incidentId),
                HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<InvestigationSummary>> getAllInvestigations(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(investigationService.getAllInvestigations(companyId), HttpStatus.OK);
    }

    @GetMapping("/getById/{id}")
    public ResponseEntity<InvestResponse> getInvestigationById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(investigationService.getInvestigationById(companyId, id), HttpStatus.OK);
    }

}
