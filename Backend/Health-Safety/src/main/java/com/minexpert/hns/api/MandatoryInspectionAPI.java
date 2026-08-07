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

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.compliance.MandatoryInspectionDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.MandatoryInspectionService;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRE DES INSPECTIONS REGLEMENTAIRES D'EQUIPEMENTS — cloisonne par mine.
 */
@RestController
@RequestMapping("/mandatory-inspection")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class MandatoryInspectionAPI {

    private final MandatoryInspectionService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestBody MandatoryInspectionDTO dto,
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(service.create(dto, companyId), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestBody MandatoryInspectionDTO dto) throws HSException {
        service.update(dto);
        return new ResponseEntity<>(new ResponseDTO("Inspection updated successfully"), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activate(@PathVariable Long id) throws HSException {
        service.activate(id);
        return new ResponseEntity<>(new ResponseDTO("Inspection activated successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivate(@PathVariable Long id) throws HSException {
        service.deactivate(id);
        return new ResponseEntity<>(new ResponseDTO("Inspection deactivated successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MandatoryInspectionDTO> getById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<MandatoryInspectionDTO>> getAll(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }
}
