package com.minexpert.hns.dosimetry.api;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
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
import com.minexpert.hns.dosimetry.dto.ExposureProfileLinkDTO;
import com.minexpert.hns.dosimetry.service.ExposureProfileLinkService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST pour les liens ExposureProfile x MeasurementPoint avec fractions de temps.
 */
@RestController
@RequestMapping("/dosimetry/exposure-profile-link")
@CrossOrigin
@RequiredArgsConstructor
public class ExposureProfileLinkController {

    private final ExposureProfileLinkService service;

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/by-profile/{profileId}")
    public ResponseEntity<List<ExposureProfileLinkDTO>> byProfile(@PathVariable Long profileId) {
        return new ResponseEntity<>(service.findByProfile(profileId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "')")
    @PostMapping("/set/{profileId}")
    public ResponseEntity<ResponseDTO> set(@PathVariable Long profileId,
            @RequestBody @Valid List<ExposureProfileLinkDTO> links,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.setLinks(profileId, links, userId);
        return new ResponseEntity<>(new ResponseDTO("Links updated"), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping("/estimated-dose/{profileId}")
    public ResponseEntity<BigDecimal> estimatedDose(@PathVariable Long profileId,
            @RequestParam(value = "workHoursPerYear", defaultValue = "1607") int workHoursPerYear) {
        return new ResponseEntity<>(
                service.computeEstimatedAnnualDose(profileId, workHoursPerYear),
                HttpStatus.OK);
    }
}
