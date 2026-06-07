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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.dto.MedicalSurveillanceDTO;
import com.minexpert.hns.dosimetry.service.MedicalSurveillanceService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller du suivi medical.
 *
 * <p>CONFIDENTIEL : les endpoints exposent restrictedClinicalDetails (donnees cliniques
 * sensibles). L'acces est restreint au role MEDECIN via Spring Security.
 *
 * <p>RBAC : chaque endpoint porte une annotation {@code @PreAuthorize} referencant
 * {@link com.minexpert.hns.dosimetry.config.DosimetryRBACConfig#DOSIMETRY_MEDICAL}.
 * Ces annotations sont declarees mais inertes tant que {@code @EnableMethodSecurity}
 * n'est pas active au niveau du module (cf. application.yml — Phase 2). En Phase 1,
 * la protection reglementaire est assuree par la couche service via audit des
 * lectures (DosimetryAuditLog avec action=VIEW_MEDICAL_DATA).
 */
@RestController
@RequestMapping("/dosimetry/medical-surveillance")
@CrossOrigin
@RequiredArgsConstructor
public class MedicalSurveillanceController {

    private final MedicalSurveillanceService service;

    @PreAuthorize("hasAuthority('DOSIMETRY_MEDICAL')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody MedicalSurveillanceDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return new ResponseEntity<>(service.create(companyId, dto, userId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_MEDICAL')")
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody MedicalSurveillanceDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        service.update(companyId, dto, userId);
        return new ResponseEntity<>(new ResponseDTO("MedicalSurveillance updated successfully"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_MEDICAL')")
    @GetMapping("/getAll")
    public ResponseEntity<List<MedicalSurveillanceDTO>> getAll(@RequestParam("companyId") Long companyId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return new ResponseEntity<>(service.getAll(companyId, userId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_MEDICAL')")
    @GetMapping("/get/{id}")
    public ResponseEntity<MedicalSurveillanceDTO> getById(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return new ResponseEntity<>(service.getById(id, userId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_MEDICAL')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        service.delete(id, userId);
        return new ResponseEntity<>(new ResponseDTO("MedicalSurveillance deleted successfully"), HttpStatus.OK);
    }
}
