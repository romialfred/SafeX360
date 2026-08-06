package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeMonitoringDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Tableau de bord « Suivi des EPI » (pilotage des stocks & distributions).
 * Cloisonné par mine (companyId = mine active du header). `days` = fenêtre d'analyse.
 */
@RestController
@CrossOrigin
@RequestMapping("/ppe-monitoring")
@RequiredArgsConstructor
public class PpeMonitoringController {
    private final PpeMonitoringService monitoringService;

    @GetMapping("/summary")
    public ResponseEntity<PpeMonitoringDTO> summary(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false, defaultValue = "30") int days) throws HSException {
        return ResponseEntity.ok(monitoringService.getMonitoring(companyId, days));
    }
}
