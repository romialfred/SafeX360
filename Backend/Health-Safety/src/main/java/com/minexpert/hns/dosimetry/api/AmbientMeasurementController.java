package com.minexpert.hns.dosimetry.api;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementDTO;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementStatsDTO;
import com.minexpert.hns.dosimetry.service.AmbientMeasurementService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST pour les mesures d'ambiance H*(10).
 *
 * <p>Lecture sous {@code DOSIMETRY_READ_AGGREGATE} (l'ambiance n'est PAS une donnee nominative) ;
 * ecriture sous {@code DOSIMETRY_WRITE}.
 */
@RestController
@RequestMapping("/dosimetry/ambient-measurement")
@CrossOrigin
@RequiredArgsConstructor
public class AmbientMeasurementController {

    private final AmbientMeasurementService service;

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/record")
    public ResponseEntity<AmbientMeasurementDTO> record(
            @Valid @RequestBody AmbientMeasurementDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return new ResponseEntity<>(service.recordMeasurement(dto, userId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/search")
    public ResponseEntity<List<AmbientMeasurementDTO>> search(
            @RequestParam("measurementPointId") Long measurementPointId,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return new ResponseEntity<>(service.findByPoint(measurementPointId, from, to),
                HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/by-point")
    public ResponseEntity<List<AmbientMeasurementDTO>> byPoint(
            @RequestParam("measurementPointId") Long measurementPointId,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return new ResponseEntity<>(service.findByPoint(measurementPointId, from, to),
                HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/by-campaign")
    public ResponseEntity<List<AmbientMeasurementDTO>> byCampaign(
            @RequestParam("campaignId") Long campaignId) {
        return new ResponseEntity<>(service.findByCampaign(campaignId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/stats")
    public ResponseEntity<AmbientMeasurementStatsDTO> stats(
            @RequestParam("measurementPointId") Long measurementPointId,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return new ResponseEntity<>(service.getStatsByPoint(measurementPointId, from, to),
                HttpStatus.OK);
    }
}
