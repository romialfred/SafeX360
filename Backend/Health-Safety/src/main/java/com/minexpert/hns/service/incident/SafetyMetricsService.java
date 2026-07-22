package com.minexpert.hns.service.incident;

import java.util.List;

import com.minexpert.hns.dto.IncidentInjuryDTO;
import com.minexpert.hns.dto.WorkedHoursDTO;
import com.minexpert.hns.dto.response.SafetyKpiDTO;
import com.minexpert.hns.exception.HSException;

/**
 * Classification des lésions + indicateurs de fréquence (ISO 45001 §9.1.1 —
 * ILO/OSHA) : lésions par personne, heures travaillées (dénominateur), et calcul
 * LTIFR / TRIFR / taux de gravité. Cloisonné par mine.
 */
public interface SafetyMetricsService {

    // ── Lésions par incident ──
    IncidentInjuryDTO addInjury(Long companyId, Long incidentId, IncidentInjuryDTO dto) throws HSException;

    List<IncidentInjuryDTO> listInjuries(Long companyId, Long incidentId) throws HSException;

    void deleteInjury(Long companyId, Long injuryId) throws HSException;

    // ── Heures travaillées (dénominateur) ──
    WorkedHoursDTO upsertWorkedHours(Long companyId, WorkedHoursDTO dto) throws HSException;

    List<WorkedHoursDTO> listWorkedHours(Long companyId, int year) throws HSException;

    // ── Indicateurs de fréquence ──
    SafetyKpiDTO computeKpi(Long companyId, int year);
}
