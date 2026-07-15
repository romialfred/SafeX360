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
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<BlastSettingDTO> getByMine(@PathVariable Long mineId,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        // Le companyId valide prime sur le mineId du path (non valide par le
        // filtre) : empeche la lecture des parametres d'une autre mine.
        Long effectiveMine = companyId != null ? companyId : mineId;
        return new ResponseEntity<>(service.getByMineId(effectiveMine), HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_ADMIN + "')")
    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(@Valid @RequestBody BlastSettingDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        // Force le mineId cible sur la mine appelante validee : empeche la
        // modification des parametres d'une autre mine via un mineId falsifie.
        if (companyId != null) {
            dto.setMineId(companyId);
        }
        service.update(dto, userId);
        return new ResponseEntity<>(new ResponseDTO("Blast setting updated"), HttpStatus.OK);
    }
}
