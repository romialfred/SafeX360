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

import com.minexpert.hns.dosimetry.dto.ExposedWorkerDTO;
import com.minexpert.hns.dosimetry.service.ExposedWorkerService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller du registre des travailleurs exposes.
 *
 * <p>RBAC : annotations {@code @PreAuthorize} declarees mais inertes tant que
 * {@code @EnableMethodSecurity} n'est pas active (Phase 2 — cf. application.yml).
 * En Phase 1, l'audit des lectures nominatives est porte cote service via
 * DosimetryAuditLog (action=VIEW_NOMINATIVE_DOSE, conformite RGPD art. 30 +
 * AIEA GSR Part 3 §3.106).
 */
@RestController
@RequestMapping("/dosimetry/exposed-worker")
@CrossOrigin
@RequiredArgsConstructor
public class ExposedWorkerController {

    private final ExposedWorkerService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody ExposedWorkerDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody ExposedWorkerDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("ExposedWorker updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ExposedWorkerDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    /**
     * Lecture nominative d'un travailleur expose : ECRIT un DosimetryAuditLog avec action
     * "VIEW_NOMINATIVE_DOSE" + userId + userPermissions (depuis X-Permissions header).
     * Trace RBAC fin pour la conformite RGPD / reglementation radioprotection.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/get/{id}")
    public ResponseEntity<ExposedWorkerDTO> getById(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Permissions", required = false) String userPermissions) {
        return new ResponseEntity<>(service.getById(id, userId, userPermissions), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        service.delete(id, userId);
        return new ResponseEntity<>(new ResponseDTO("ExposedWorker deleted successfully"), HttpStatus.OK);
    }
}
