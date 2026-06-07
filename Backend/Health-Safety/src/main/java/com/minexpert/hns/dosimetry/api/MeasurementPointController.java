package com.minexpert.hns.dosimetry.api;

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

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MeasurementPointDTO;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.service.MeasurementPointService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST pour la gestion des points fixes de mesure d'ambiance H*(10).
 */
@RestController
@RequestMapping("/dosimetry/measurement-point")
@CrossOrigin
@RequiredArgsConstructor
public class MeasurementPointController {

    private final MeasurementPointService service;

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/search")
    public ResponseEntity<List<MeasurementPointDTO>> search(
            @RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(service.listByMine(mineId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/by-zone")
    public ResponseEntity<List<MeasurementPointDTO>> listByZone(
            @RequestParam("mineId") Long mineId,
            @RequestParam("zoneClassification") ZoneClass zoneClassification) {
        return new ResponseEntity<>(service.listByZone(mineId, zoneClassification), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/detail/{id}")
    public ResponseEntity<MeasurementPointDTO> detail(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@Valid @RequestBody MeasurementPointDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        return new ResponseEntity<>(service.create(dto, userId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PutMapping("/update/{id}")
    public ResponseEntity<ResponseDTO> update(@PathVariable Long id,
            @Valid @RequestBody MeasurementPointDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.update(id, dto, userId);
        return new ResponseEntity<>(new ResponseDTO("MeasurementPoint updated successfully"),
                HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activate(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.activate(id, userId);
        return new ResponseEntity<>(new ResponseDTO("MeasurementPoint activated"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivate(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.deactivate(id, userId);
        return new ResponseEntity<>(new ResponseDTO("MeasurementPoint deactivated"),
                HttpStatus.OK);
    }
}
