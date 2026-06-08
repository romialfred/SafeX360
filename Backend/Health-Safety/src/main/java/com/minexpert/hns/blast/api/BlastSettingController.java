package com.minexpert.hns.blast.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.blast.dto.BlastSettingDTO;
import com.minexpert.hns.blast.service.BlastSettingService;
import com.minexpert.hns.dto.ResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST des parametres du module Blast Management (par mine).
 */
@RestController
@RequestMapping("/blast-setting")
@CrossOrigin
@RequiredArgsConstructor
public class BlastSettingController {

    private final BlastSettingService service;

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/by-mine/{mineId}")
    public ResponseEntity<BlastSettingDTO> getByMine(@PathVariable Long mineId) {
        return new ResponseEntity<>(service.getByMineId(mineId), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_ADMIN + "')")
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@Valid @RequestBody BlastSettingDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        service.update(dto, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast setting updated"), HttpStatus.OK);
    }
}
