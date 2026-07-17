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
import com.minexpert.hns.dto.indicator.HsIndicatorDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.indicator.HsIndicatorService;

import lombok.RequiredArgsConstructor;

/**
 * API du referentiel d'indicateurs HSE (gateway `/hns/indicator`). companyId
 * arrive en query (clampe/valide par CompanyScopeFilter).
 */
@RestController
@RequestMapping("/indicator")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class HsIndicatorAPI {

    private final HsIndicatorService indicatorService;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam(required = false) Long companyId,
            @RequestBody HsIndicatorDTO dto) throws HSException {
        return new ResponseEntity<>(indicatorService.createIndicator(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam(required = false) Long companyId,
            @RequestBody HsIndicatorDTO dto) throws HSException {
        indicatorService.updateIndicator(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("Indicator updated."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<HsIndicatorDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(indicatorService.getAllIndicators(companyId), HttpStatus.OK);
    }

    @GetMapping("/getForecastable")
    public ResponseEntity<List<HsIndicatorDTO>> getForecastable(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(indicatorService.getForecastableIndicators(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<HsIndicatorDTO> getById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(indicatorService.getIndicatorById(companyId, id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        indicatorService.deleteIndicator(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Indicator deactivated."), HttpStatus.OK);
    }
}
