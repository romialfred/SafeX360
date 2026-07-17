package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.indicator.IndicatorPlanDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.indicator.IndicatorPlanService;

import lombok.RequiredArgsConstructor;

/**
 * API des plans de cibles/previsions (gateway `/hns/indicator-plan`).
 * GET /get renvoie le plan existant ou un squelette pret a remplir.
 */
@RestController
@RequestMapping("/indicator-plan")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class IndicatorPlanAPI {

    private final IndicatorPlanService planService;

    @GetMapping("/get")
    public ResponseEntity<IndicatorPlanDTO> getPlan(@RequestParam(required = false) Long companyId,
            @RequestParam Long indicatorId, @RequestParam Integer year) throws HSException {
        return new ResponseEntity<>(planService.getPlan(companyId, indicatorId, year), HttpStatus.OK);
    }

    @PostMapping("/save")
    public ResponseEntity<IndicatorPlanDTO> savePlan(@RequestParam(required = false) Long companyId,
            @RequestBody IndicatorPlanDTO dto) throws HSException {
        return new ResponseEntity<>(planService.savePlan(companyId, dto), HttpStatus.OK);
    }
}
