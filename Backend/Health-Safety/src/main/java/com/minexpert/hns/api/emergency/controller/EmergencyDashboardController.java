package com.minexpert.hns.api.emergency.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.api.emergency.dto.EmergencyDashboardDTO;
import com.minexpert.hns.api.emergency.service.EmergencyDashboardService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoint Tableau de bord Emergency (LOT 48 Phase 5).
 *
 * <p>Base : {@code /hns/emergency/dashboard}.</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/emergency/dashboard")
@RequiredArgsConstructor
public class EmergencyDashboardController {

    private final EmergencyDashboardService service;

    /**
     * Résumé agrégé du tableau de bord pour une mine sur une fenêtre de N jours.
     *
     * @param companyId ID mine
     * @param windowDays Fenêtre temporelle (7, 30, 90...). Défaut 7.
     */
    @GetMapping("/summary")
    public ResponseEntity<EmergencyDashboardDTO> summary(
        @RequestParam Long companyId,
        @RequestParam(defaultValue = "7") int windowDays
    ) {
        return ResponseEntity.ok(service.getSummary(companyId, windowDays));
    }
}
