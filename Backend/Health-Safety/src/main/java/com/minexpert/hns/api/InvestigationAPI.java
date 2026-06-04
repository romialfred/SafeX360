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

    @PostMapping("/create")
    public ResponseEntity<Long> createInvestigation(@RequestParam("companyId") Long companyId,
            @RequestBody InvestActionDTO request) throws HSException {
        return new ResponseEntity<>(investigationService.addInvestigation(companyId, request), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateInvestigation(@RequestParam("companyId") Long companyId,
            @RequestBody InvestActionDTO request) throws HSException {
        investigationService.updateInvestigation(companyId, request);
        return new ResponseEntity<>(new ResponseDTO("Investigation updated successfully."), HttpStatus.OK);
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
