package com.minexpert.hns.blast.api;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.blast.dto.BlastCancelRequestDTO;
import com.minexpert.hns.blast.dto.BlastCreateDTO;
import com.minexpert.hns.blast.dto.BlastDetailDTO;
import com.minexpert.hns.blast.dto.BlastListItemDTO;
import com.minexpert.hns.blast.dto.BlastMisfireRequestDTO;
import com.minexpert.hns.blast.dto.BlastRescheduleRequestDTO;
import com.minexpert.hns.blast.dto.BlastResolveMisfireRequestDTO;
import com.minexpert.hns.blast.dto.BlastSearchFiltersDTO;
import com.minexpert.hns.blast.dto.BlastUpdateDTO;
import com.minexpert.hns.blast.service.BlastService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST du registre des tirs.
 *
 * <p>RBAC via {@link BlastRBACConfig}. Aucune action n'envoie d'e-mail ou ne
 * declenche d'alerte : ces canaux sont branches en Phase 3 et Phase 4.
 */
@RestController
@RequestMapping("/hns/blast")
@CrossOrigin
@RequiredArgsConstructor
public class BlastController {

    private final BlastService service;

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_PLAN + "')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@Valid @RequestBody BlastCreateDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        return new ResponseEntity<>(service.create(dto, userId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyAuthority('" + BlastRBACConfig.BLAST_PLAN + "','"
            + BlastRBACConfig.BLAST_ADMIN + "')")
    @PutMapping("/update/{id}")
    public ResponseEntity<ResponseDTO> update(@PathVariable Long id,
            @Valid @RequestBody BlastUpdateDTO dto,
            @RequestParam(value = "adminOverride", required = false, defaultValue = "false")
            boolean adminOverride,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        // Securise le contrat : l'id du path fait foi.
        dto.setId(id);
        service.update(dto, userId, adminOverride);
        return new ResponseEntity<>(new ResponseDTO("Blast updated"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_CONFIRM + "')")
    @PostMapping("/confirm/{id}")
    public ResponseEntity<ResponseDTO> confirm(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.confirm(id, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast confirmed"), HttpStatus.OK);
    }

    /**
     * Annule un tir. P5 : accepte un body JSON {@code { "reason": "..." }} OU,
     * pour retrocompatibilite avec les clients deployes en P1/P2, un query
     * param {@code ?reason=...}. La precedence va au body JSON si les deux
     * sont fournis.
     */
    @PreAuthorize("hasAnyAuthority('" + BlastRBACConfig.BLAST_PLAN + "','"
            + BlastRBACConfig.BLAST_ADMIN + "')")
    @PostMapping("/cancel/{id}")
    public ResponseEntity<ResponseDTO> cancel(@PathVariable Long id,
            @RequestBody(required = false) BlastCancelRequestDTO body,
            @RequestParam(value = "reason", required = false) String reasonParam,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String reason = (body != null && body.getReason() != null) ? body.getReason() : reasonParam;
        service.cancel(id, reason, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast cancelled"), HttpStatus.OK);
    }

    /**
     * Reporte un tir. P5 : accepte un body JSON
     * {@code { "newScheduledAt": "...", "reason": "..." }} ; les query params
     * historiques {@code ?newScheduledAt=...&reason=...} restent acceptes
     * pour retrocompatibilite. Format ISO LocalDateTime
     * ({@code 2026-06-18T14:00:00}).
     */
    @PreAuthorize("hasAnyAuthority('" + BlastRBACConfig.BLAST_PLAN + "','"
            + BlastRBACConfig.BLAST_ADMIN + "')")
    @PostMapping("/reschedule/{id}")
    public ResponseEntity<ResponseDTO> reschedule(@PathVariable Long id,
            @RequestBody(required = false) BlastRescheduleRequestDTO body,
            @RequestParam(value = "newScheduledAt", required = false) String newScheduledAtParam,
            @RequestParam(value = "reason", required = false) String reasonParam,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String newScheduledAt = (body != null && body.getNewScheduledAt() != null)
                ? body.getNewScheduledAt() : newScheduledAtParam;
        String reason = (body != null && body.getReason() != null)
                ? body.getReason() : reasonParam;
        if (newScheduledAt == null || newScheduledAt.isBlank()) {
            throw new IllegalArgumentException("newScheduledAt is required");
        }
        LocalDateTime parsed = LocalDateTime.parse(newScheduledAt);
        service.reschedule(id, parsed, reason, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast rescheduled"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_CONFIRM + "')")
    @PostMapping("/declare-fired/{id}")
    public ResponseEntity<ResponseDTO> declareFired(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.declareFired(id, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast declared fired"), HttpStatus.OK);
    }

    /**
     * Declare un raté. P5 : body JSON {@code { "reason": "..." }} accepte ; le
     * query param {@code ?reason=...} reste accepte pour retrocompatibilite.
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_CONFIRM + "')")
    @PostMapping("/declare-misfire/{id}")
    public ResponseEntity<ResponseDTO> declareMisfire(@PathVariable Long id,
            @RequestBody(required = false) BlastMisfireRequestDTO body,
            @RequestParam(value = "reason", required = false) String reasonParam,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String reason = (body != null && body.getReason() != null) ? body.getReason() : reasonParam;
        service.declareMisfire(id, reason, userId);
        return new ResponseEntity<>(new ResponseDTO("Misfire declared"), HttpStatus.OK);
    }

    /**
     * Leve le verrou misfire. P5 : body JSON
     * {@code { "resolutionNotes": "..." }} accepte (privilegie pour
     * persistance dans la colonne {@code misfire_resolution_notes}). Les
     * anciens clients qui envoient {@code ?reason=...} restent acceptes ; le
     * texte est traite comme notes de resolution.
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_ADMIN + "')")
    @PostMapping("/resolve-misfire/{id}")
    public ResponseEntity<ResponseDTO> resolveMisfire(@PathVariable Long id,
            @RequestBody(required = false) BlastResolveMisfireRequestDTO body,
            @RequestParam(value = "reason", required = false) String reasonParam,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        String notes = null;
        if (body != null) {
            if (body.getResolutionNotes() != null) {
                notes = body.getResolutionNotes();
            } else if (body.getReason() != null) {
                notes = body.getReason();
            }
        }
        if (notes == null) {
            notes = reasonParam;
        }
        service.resolveMisfire(id, notes, userId);
        return new ResponseEntity<>(new ResponseDTO("Misfire resolved"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_CONFIRM + "')")
    @PostMapping("/all-clear/{id}")
    public ResponseEntity<ResponseDTO> allClear(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.allClear(id, userId);
        return new ResponseEntity<>(new ResponseDTO("All clear pronounced"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @PostMapping("/search")
    public ResponseEntity<List<BlastListItemDTO>> search(
            @RequestBody BlastSearchFiltersDTO filters) {
        return new ResponseEntity<>(service.search(filters), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/detail/{id}")
    public ResponseEntity<BlastDetailDTO> detail(@PathVariable Long id) {
        return new ResponseEntity<>(service.getDetail(id), HttpStatus.OK);
    }
}
