package com.minexpert.hns.dosimetry.api;

import java.util.List;
import java.util.Map;

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

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.dto.ExposureAlertEnrichedDTO;
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
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_ADMIN + "')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("ExposureAlert deleted successfully"), HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Phase 5 — endpoints operationnels (centre d'alerte).
    // ----------------------------------------------------------------------------

    /**
     * Liste des alertes ACTIVE pour une mine, enrichies des infos worker (employeeId,
     * category). Sert au centre d'alerte du frontend.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/active")
    public ResponseEntity<List<ExposureAlertEnrichedDTO>> findActive(
            @RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(service.findActiveByMine(mineId), HttpStatus.OK);
    }

    /**
     * Acquittement d'une alerte. Body : {@code { "note": "...", "actorId": 42 }}.
     *
     * <p>{@code actorId} est passe en parametre tant que l'extraction du JWT n'est pas active
     * cote {@code SecurityConfig} (cf. Phase 2). Une fois le contexte de securite branche,
     * actorId sera lu depuis {@code SecurityContextHolder} et le body ne contiendra que la note.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/acknowledge/{id}")
    public ResponseEntity<ResponseDTO> acknowledge(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String note = body != null && body.get("note") != null ? body.get("note").toString() : null;
        Long actorId = extractActorId(body);
        service.acknowledge(id, actorId, note);
        return new ResponseEntity<>(new ResponseDTO("ExposureAlert acknowledged"), HttpStatus.OK);
    }

    /**
     * Resolution d'une alerte. Body : {@code { "resolutionNote": "...", "actorId": 42 }}.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/resolve/{id}")
    public ResponseEntity<ResponseDTO> resolve(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String note = body != null && body.get("resolutionNote") != null
                ? body.get("resolutionNote").toString() : null;
        Long actorId = extractActorId(body);
        service.resolve(id, actorId, note);
        return new ResponseEntity<>(new ResponseDTO("ExposureAlert resolved"), HttpStatus.OK);
    }

    /**
     * Liste des alertes ACTIVE pour un travailleur donne. Permission nominative (lecture des
     * doses individuelles -> trace audit obligatoire cote service).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping("/active-by-worker/{workerId}")
    public ResponseEntity<List<ExposureAlertEnrichedDTO>> findActiveByWorker(
            @PathVariable Long workerId) {
        return new ResponseEntity<>(service.findActiveByWorker(workerId), HttpStatus.OK);
    }

    private Long extractActorId(Map<String, Object> body) {
        if (body == null || body.get("actorId") == null) return null;
        Object v = body.get("actorId");
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
