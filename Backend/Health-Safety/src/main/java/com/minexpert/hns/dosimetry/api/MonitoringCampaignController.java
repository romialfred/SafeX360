package com.minexpert.hns.dosimetry.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MonitoringCampaignDTO;
import com.minexpert.hns.dosimetry.service.MonitoringCampaignService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST pour les campagnes de surveillance d'ambiance.
 *
 * <p>Les transitions critiques (start/complete) requierent la permission PCR/RPO.
 */
@RestController
@RequestMapping("/dosimetry/monitoring-campaign")
@CrossOrigin
@RequiredArgsConstructor
public class MonitoringCampaignController {

    private final MonitoringCampaignService service;

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/search")
    public ResponseEntity<List<MonitoringCampaignDTO>> search(
            @RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(service.listByMine(mineId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/detail/{id}")
    public ResponseEntity<MonitoringCampaignDTO> detail(@PathVariable Long id) {
        return new ResponseEntity<>(service.getById(id), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @PostMapping("/create")
    public ResponseEntity<Long> create(@Valid @RequestBody MonitoringCampaignDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        return new ResponseEntity<>(service.createCampaign(dto, userId), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @PostMapping("/start/{id}")
    public ResponseEntity<ResponseDTO> start(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.startCampaign(id, userId);
        return new ResponseEntity<>(new ResponseDTO("Campaign started"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @PostMapping("/complete/{id}")
    public ResponseEntity<ResponseDTO> complete(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.completeCampaign(id, userId);
        return new ResponseEntity<>(new ResponseDTO("Campaign completed"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @PostMapping("/cancel/{id}")
    public ResponseEntity<ResponseDTO> cancel(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.cancelCampaign(id, userId);
        return new ResponseEntity<>(new ResponseDTO("Campaign cancelled"), HttpStatus.OK);
    }

    // addMeasurementPoint reste sous DOSIMETRY_WRITE : permet aux operateurs en phase DRAFT
    // d ajuster le perimetre ; verrouille apres ONGOING via le service (cf. assertDraftEditable).
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/add-point/{id}")
    public ResponseEntity<ResponseDTO> addPoint(@PathVariable Long id,
            @RequestParam("measurementPointId") Long measurementPointId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.addMeasurementPoint(id, measurementPointId, userId);
        return new ResponseEntity<>(new ResponseDTO("Point added to campaign"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping(value = "/report/{id}", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> report(@PathVariable Long id) {
        return new ResponseEntity<>(service.generateReport(id), HttpStatus.OK);
    }
}
