package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import com.minexpert.hns.dosimetry.dto.DosimetryAuditLogDTO;
import com.minexpert.hns.dosimetry.service.DosimetryAuditLogService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller du journal d'audit dosimetrie.
 *
 * <p>APPEND-ONLY : update et delete renvoient HTTP 405 METHOD_NOT_ALLOWED.
 * L'immutabilite est aussi garantie par des triggers SQL BEFORE UPDATE/DELETE.
 */
@RestController
@RequestMapping("/dosimetry/audit-log")
@CrossOrigin
@RequiredArgsConstructor
public class DosimetryAuditLogController {

    private final DosimetryAuditLogService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody DosimetryAuditLogDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    /** Append-only : refuse toute mise a jour. */
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody DosimetryAuditLogDTO dto) {
        return new ResponseEntity<>(
                new ResponseDTO("DosimetryAuditLog is append-only - update forbidden"),
                HttpStatus.METHOD_NOT_ALLOWED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DosimetryAuditLogDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DosimetryAuditLogDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    /** Append-only : refuse toute suppression. */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        return new ResponseEntity<>(
                new ResponseDTO("DosimetryAuditLog is append-only - delete forbidden"),
                HttpStatus.METHOD_NOT_ALLOWED);
    }
}
