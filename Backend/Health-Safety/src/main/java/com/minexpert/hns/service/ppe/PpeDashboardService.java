package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeDashboardDTO;
import com.minexpert.hns.exception.HSException;

import java.time.LocalDate;

public interface PpeDashboardService {

    /** Synthèse décisionnelle EPI d'une mine, flux valorisés sur la période [from, to] (bornes optionnelles). */
    PpeDashboardDTO getDashboard(Long companyId, LocalDate from, LocalDate to) throws HSException;
}
