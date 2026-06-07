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

import com.minexpert.hns.dosimetry.dto.ThresholdDTO;
import com.minexpert.hns.dosimetry.service.ThresholdService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des seuils dosimetriques (Threshold).
 *
 * <p>RBAC : annotations {@code @PreAuthorize} declarees mais inertes tant que
 * {@code @EnableMethodSecurity} n'est pas active (Phase 2 — cf. application.yml).
 */
@RestController
@RequestMapping("/dosimetry/threshold")
@CrossOrigin
@RequiredArgsConstructor
public class ThresholdController {

    private final ThresholdService service;

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody ThresholdDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody ThresholdDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("Threshold updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ThresholdDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ThresholdDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("Threshold deleted successfully"), HttpStatus.OK);
    }
}
