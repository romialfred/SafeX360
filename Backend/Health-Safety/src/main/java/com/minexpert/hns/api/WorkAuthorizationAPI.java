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
import com.minexpert.hns.dto.compliance.WorkAuthorizationDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.WorkAuthorizationService;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRE DES AUTORISATIONS DE TRAVAUX — cloisonne par mine.
 */
@RestController
@RequestMapping("/work-authorization")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class WorkAuthorizationAPI {

    private final WorkAuthorizationService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestBody WorkAuthorizationDTO dto,
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(service.create(dto, companyId), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestBody WorkAuthorizationDTO dto) throws HSException {
        service.update(dto);
        return new ResponseEntity<>(new ResponseDTO("Work authorization updated successfully"), HttpStatus.OK);
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<ResponseDTO> close(@PathVariable Long id) throws HSException {
        service.close(id);
        return new ResponseEntity<>(new ResponseDTO("Work authorization closed successfully"), HttpStatus.OK);
    }

    @PutMapping("/reopen/{id}")
    public ResponseEntity<ResponseDTO> reopen(@PathVariable Long id) throws HSException {
        service.reopen(id);
        return new ResponseEntity<>(new ResponseDTO("Work authorization reopened successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkAuthorizationDTO> getById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkAuthorizationDTO>> getAll(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }
}
