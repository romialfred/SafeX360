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
import com.minexpert.hns.dosimetry.dto.OverexposureCaseDTO;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.service.OverexposureCaseService;
import com.minexpert.hns.dto.ResponseDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller des dossiers de surexposition.
 *
 * <p>RBAC : annotations {@code @PreAuthorize} declarees mais inertes tant que
 * {@code @EnableMethodSecurity} n'est pas active (Phase 2). La cloture d'un dossier necessite
 * la permission {@code DOSIMETRY_PCR_RPO} (separation des devoirs).
 */
@RestController
@RequestMapping("/dosimetry/overexposure-case")
@CrossOrigin
@RequiredArgsConstructor
public class OverexposureCaseController {

    private final OverexposureCaseService service;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestParam("companyId") Long companyId,
            @RequestBody OverexposureCaseDTO dto) {
        return new ResponseEntity<>(service.create(companyId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@RequestParam("companyId") Long companyId,
            @RequestBody OverexposureCaseDTO dto) {
        service.update(companyId, dto);
        return new ResponseEntity<>(new ResponseDTO("OverexposureCase updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<OverexposureCaseDTO>> getAll(@RequestParam("companyId") Long companyId) {
        return new ResponseEntity<>(service.getAll(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<OverexposureCaseDTO> getById(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) {
        service.delete(id);
        return new ResponseEntity<>(new ResponseDTO("OverexposureCase deleted successfully"), HttpStatus.OK);
    }

    // ----------------------------------------------------------------------------
    // Phase 5 — workflow OPEN -> INVESTIGATING -> CLOSED.
    // ----------------------------------------------------------------------------

    /**
     * Ouverture explicite d'un dossier de surexposition. Body :
     * <pre>{
     *   "workerId": 12,
     *   "alertId": 88,   // optionnel
     *   "openedBy": 42,
     *   "cause": "depassement Hp10 trim. Q2",
     *   "level": "ACTION"
     * }</pre>
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/open")
    public ResponseEntity<Long> open(@RequestBody Map<String, Object> body) {
        Long workerId = asLong(body.get("workerId"));
        Long alertId = asLong(body.get("alertId"));
        Long openedBy = asLong(body.get("openedBy"));
        String cause = body.get("cause") != null ? body.get("cause").toString() : null;
        AlertLevel level = body.get("level") != null
                ? AlertLevel.valueOf(body.get("level").toString())
                : null;
        Long id = service.openCase(workerId, alertId, openedBy, cause, level);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    /**
     * Passage en investigation + saisie des actions correctives / decision medicale.
     * Body : {@code { "correctiveActions": "...", "medicalDecision": "...", "actorId": 42 }}
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/investigate/{id}")
    public ResponseEntity<ResponseDTO> investigate(@PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String correctiveActions = body.get("correctiveActions") != null
                ? body.get("correctiveActions").toString() : null;
        String medicalDecision = body.get("medicalDecision") != null
                ? body.get("medicalDecision").toString() : null;
        Long actorId = asLong(body.get("actorId"));
        service.addInvestigation(id, correctiveActions, medicalDecision, actorId);
        return new ResponseEntity<>(new ResponseDTO("OverexposureCase investigation updated"),
                HttpStatus.OK);
    }

    /**
     * Cloture d'un dossier. RBAC dedie {@code DOSIMETRY_PCR_RPO} : seuls les PCR / RPO peuvent
     * fermer un dossier (separation des devoirs).
     * Body : {@code { "authorityDeclaration": true, "actorId": 42, "closureNote": "..." }}
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @PostMapping("/close/{id}")
    public ResponseEntity<ResponseDTO> close(@PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        boolean authorityDeclaration = body.get("authorityDeclaration") != null
                && Boolean.parseBoolean(body.get("authorityDeclaration").toString());
        Long actorId = asLong(body.get("actorId"));
        String closureNote = body.get("closureNote") != null
                ? body.get("closureNote").toString() : null;
        service.closeCase(id, authorityDeclaration, actorId, closureNote);
        return new ResponseEntity<>(new ResponseDTO("OverexposureCase closed"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping("/by-worker/{id}")
    public ResponseEntity<List<OverexposureCaseDTO>> byWorker(@PathVariable("id") Long workerId) {
        return new ResponseEntity<>(service.findByWorker(workerId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/active")
    public ResponseEntity<List<OverexposureCaseDTO>> active(@RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(service.findActive(mineId), HttpStatus.OK);
    }

    private Long asLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
