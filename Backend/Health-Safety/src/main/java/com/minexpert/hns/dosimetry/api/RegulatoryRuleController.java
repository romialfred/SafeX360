package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.dto.RegulatoryRuleApprovalRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolveRequest;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleResolutionDTO;
import com.minexpert.hns.dosimetry.dto.RegulatoryRuleRetirementRequest;
import com.minexpert.hns.dosimetry.service.RegulatoryRuleService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Administration et décision des règles dosimétriques locales. */
@RestController
@RequestMapping("/dosimetry/regulatory-rules")
@RequiredArgsConstructor
public class RegulatoryRuleController {

    private final RegulatoryRuleService service;

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody RegulatoryRuleDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @PathVariable Long id, @Valid @RequestBody RegulatoryRuleDTO dto) {
        service.update(companyId, id, dto);
        return ResponseEntity.ok(new ResponseDTO("Version brouillon mise à jour"));
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping("/{id}/submit-review")
    public ResponseEntity<ResponseDTO> submitReview(@RequestParam("companyId") Long companyId,
            @PathVariable Long id, @RequestParam("actorId") Long actorId) {
        service.submitForReview(companyId, id, actorId);
        return ResponseEntity.ok(new ResponseDTO("Version transmise pour validation"));
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ResponseDTO> approve(@RequestParam("companyId") Long companyId,
            @PathVariable Long id, @Valid @RequestBody RegulatoryRuleApprovalRequest request) {
        service.approve(companyId, id, request);
        return ResponseEntity.ok(new ResponseDTO("Version approuvée"));
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping("/{id}/new-version")
    public ResponseEntity<Long> newVersion(@RequestParam("companyId") Long companyId,
            @PathVariable Long id, @RequestParam("actorId") Long actorId) {
        return new ResponseEntity<>(service.createNextVersion(companyId, id, actorId),
                HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('DOSIMETRY_ADMIN')")
    @PostMapping("/{id}/retire")
    public ResponseEntity<ResponseDTO> retire(@RequestParam("companyId") Long companyId,
            @PathVariable Long id, @Valid @RequestBody RegulatoryRuleRetirementRequest request) {
        service.retire(companyId, id, request);
        return ResponseEntity.ok(new ResponseDTO("Retrait planifié et tracé"));
    }

    @PreAuthorize("hasAnyAuthority('DOSIMETRY_ADMIN','DOSIMETRY_PCR_RPO','DOSIMETRY_READ_AGGREGATE')")
    @GetMapping
    public ResponseEntity<List<RegulatoryRuleDTO>> getAll(
            @RequestParam("companyId") Long companyId) {
        return ResponseEntity.ok(service.getAll(companyId));
    }

    @PreAuthorize("hasAnyAuthority('DOSIMETRY_ADMIN','DOSIMETRY_PCR_RPO','DOSIMETRY_READ_AGGREGATE')")
    @GetMapping("/{id}")
    public ResponseEntity<RegulatoryRuleDTO> getById(@RequestParam("companyId") Long companyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getById(companyId, id));
    }

    @PreAuthorize("hasAnyAuthority('DOSIMETRY_ADMIN','DOSIMETRY_PCR_RPO','DOSIMETRY_READ_AGGREGATE')")
    @PostMapping("/resolve")
    public ResponseEntity<RegulatoryRuleResolutionDTO> resolve(
            @RequestParam("companyId") Long companyId,
            @Valid @RequestBody RegulatoryRuleResolveRequest request) {
        // Le companyId authentifié prévaut sur une valeur éventuellement reçue dans le corps.
        request.setCompanyId(companyId);
        return service.resolve(companyId, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
