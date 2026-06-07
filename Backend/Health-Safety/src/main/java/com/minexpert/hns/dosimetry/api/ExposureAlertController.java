package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.service.ExposureAlertService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des alertes d'exposition.
 *
 * <p>RBAC : annotations {@code @PreAuthorize} declarees mais inertes tant que
 * {@code @EnableMethodSecurity} n'est pas active (Phase 2 — cf. application.yml).
 */
@RestController
@RequestMapping("/dosimetry/exposure-alert")
@CrossOrigin
@RequiredArgsConstructor
public class ExposureAlertController {

    private final ExposureAlertService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody ExposureAlertDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody ExposureAlertDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("ExposureAlert updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ExposureAlertDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ExposureAlertDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    // Throws UnsupportedOperationException by design : use acknowledge/resolve
    // workflows instead of hard-delete (conformite trace alerte).
    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("ExposureAlert deleted successfully"), HttpStatus.OK);
    }
}
