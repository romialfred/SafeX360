package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeDashboardDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Tableau de bord décisionnel EPI (incrément 6) : valorisation du stock et flux
 * valorisés sur une période. Cloisonné par mine (companyId = mine active du header).
 */
@RestController
@CrossOrigin
@RequestMapping("/ppe-dashboard")
@RequiredArgsConstructor
public class PpeDashboardController {
    private final PpeDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<PpeDashboardDTO> summary(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to)
            throws HSException {
        return ResponseEntity.ok(dashboardService.getDashboard(companyId, from, to));
    }
}
