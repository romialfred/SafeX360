package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.audit.ChangeLogDTO;
import com.minexpert.hns.service.audit.ChangeLogService;

import lombok.RequiredArgsConstructor;

/**
 * Journal d'audit champ-par-champ (ISO 45001 §7.5.3) — lecture de l'historique
 * des modifications d'une entité. companyId optionnel (vue consolidée).
 */
@RestController
@RequestMapping("/change-log")
@CrossOrigin
@RequiredArgsConstructor
public class ChangeLogAPI {

    private final ChangeLogService changeLogService;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<ChangeLogDTO>> getHistory(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return new ResponseEntity<>(changeLogService.list(entityType, entityId, companyId), HttpStatus.OK);
    }
}
