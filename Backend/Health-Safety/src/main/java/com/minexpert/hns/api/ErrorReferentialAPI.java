package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;
import com.minexpert.hns.entity.error.ErrorEventType;
import com.minexpert.hns.entity.error.ErrorProbability;
import com.minexpert.hns.entity.error.ErrorSeverity;
import com.minexpert.hns.service.error.ErrorReferentialService;

import lombok.RequiredArgsConstructor;

/**
 * Lecture des referentiels parametrables du module Gestion des Erreurs.
 * Path base : {@code /hns/error/referentials}. GET accessibles a tout
 * utilisateur authentifie (donnees de parametrage non sensibles).
 */
@RestController
@RequestMapping("/error/referentials")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class ErrorReferentialAPI {

    private final ErrorReferentialService referentialService;

    @GetMapping("/event-types")
    public ResponseEntity<List<ErrorEventType>> eventTypes(
            @RequestParam(name = "companyId", required = false) Long companyId) {
        return new ResponseEntity<>(referentialService.listEventTypes(companyId), HttpStatus.OK);
    }

    @GetMapping("/severities")
    public ResponseEntity<List<ErrorSeverity>> severities() {
        return new ResponseEntity<>(referentialService.listSeverities(), HttpStatus.OK);
    }

    @GetMapping("/probabilities")
    public ResponseEntity<List<ErrorProbability>> probabilities() {
        return new ResponseEntity<>(referentialService.listProbabilities(), HttpStatus.OK);
    }

    @GetMapping("/criticality-matrix")
    public ResponseEntity<List<ErrorCriticalityMatrix>> criticalityMatrix() {
        return new ResponseEntity<>(referentialService.listCriticalityMatrix(), HttpStatus.OK);
    }
}
