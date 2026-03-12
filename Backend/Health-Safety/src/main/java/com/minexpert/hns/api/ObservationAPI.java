package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.audit.ObservationDTO;
import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditService;
import com.minexpert.hns.service.audit.ObservationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/observations")
@CrossOrigin
@Validated
@RequiredArgsConstructor

public class ObservationAPI {
    private final ObservationService observationService;

    @PostMapping("/create")
    public ResponseEntity<Long> createObservation(@RequestBody ObservationDTO request) throws HSException {
        return new ResponseEntity<>(observationService.createObservation(request), HttpStatus.CREATED);
    }

    @GetMapping("/getAllByAuditId/{auditId}")
    public ResponseEntity<List<ObservationDTO>> getAllObservationsByAuditId(@PathVariable Long auditId)
            throws HSException {
        return new ResponseEntity<>(observationService.getAllObservationsByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/getObservationTitlesByAuditId/{auditId}")
    public ResponseEntity<List<ObsTitle>> getObservationTitlesByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(observationService.getObservationTitlesByAuditId(auditId), HttpStatus.OK);
    }

}
