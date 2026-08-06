package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeMonitoringDTO;
import com.minexpert.hns.exception.HSException;

public interface PpeMonitoringService {

    /** Synthèse du tableau de bord « Suivi des EPI » d'une mine (fenêtre = derniers `days` jours). */
    PpeMonitoringDTO getMonitoring(Long companyId, int days) throws HSException;
}
