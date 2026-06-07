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

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.service.DoseRecordService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des enregistrements de dose.
 *
 * <p>IMPORTANT - PATTERN APPEND-ONLY :
 * <ul>
 *   <li>create -> nouveau record version=1</li>
 *   <li>update -> NE FAIT PAS d'update direct. Cree un NOUVEAU DoseRecord avec
 *       version+1 et fixe supersededRecordId sur l'ancien. Retourne le NOUVEAU.</li>
 * </ul>
 *
 * <p>RBAC : annotations {@code @PreAuthorize} declarees mais inertes tant que
 * {@code @EnableMethodSecurity} n'est pas active (Phase 2). En Phase 1, la trace
 * de conformite est portee par DosimetryAuditLog cote service.
 */
@RestController
@RequestMapping("/dosimetry/dose-record")
@CrossOrigin
@RequiredArgsConstructor
public class DoseRecordController {

    private final DoseRecordService service;

    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody DoseRecordDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    /**
     * Append-only : cree un NOUVEAU record version+1 et marque l'ancien comme superseded.
     * Retourne l'id du nouvel enregistrement (et non un message generique).
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PutMapping("/update")
    public ResponseEntity<Long> update(@RequestParam("companyId") Long companyId,
            @RequestBody DoseRecordDTO dto) {
        Long newId = service.supersede(companyId, dto);
        return new ResponseEntity<>(newId, HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/getAll")
    public ResponseEntity<List<DoseRecordDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/get/{id}")
    public ResponseEntity<DoseRecordDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    // Throws UnsupportedOperationException by design (AIEA GSR Part 3 §3.106 :
    // les enregistrements de dose ne peuvent etre supprimes — append-only).
    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("DoseRecord deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getActiveByWorker/{workerId}")
    public ResponseEntity<List<DoseRecordDTO>> getActiveByWorker(@PathVariable Long workerId) {
        return new ResponseEntity<>(service.getActiveByWorkerId(workerId), HttpStatus.OK);
    }
}
