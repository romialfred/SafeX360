package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.IncidentInjuryDTO;
import com.minexpert.hns.dto.WorkedHoursDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.SafetyKpiDTO;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentInjury;
import com.minexpert.hns.entity.incident.WorkedHours;
import com.minexpert.hns.enums.InjuryOutcome;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentInjuryRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.WorkedHoursRepository;

@Service
@Transactional
public class SafetyMetricsServiceImpl implements SafetyMetricsService {

    /** Base des taux : par MILLION d'heures travaillées (convention minière ICMM). */
    private static final double RATE_BASE = 1_000_000d;

    @Autowired
    private IncidentInjuryRepository incidentInjuryRepository;
    @Autowired
    private WorkedHoursRepository workedHoursRepository;
    @Autowired
    private IncidentRepository incidentRepository;
    @Autowired
    private HrmsClient hrmsClient;

    private Incident requireIncident(Long companyId, Long incidentId) throws HSException {
        if (incidentId == null) {
            throw new HSException("INCIDENT_NOT_FOUND");
        }
        return incidentRepository.findByIdWithCompanyContext(incidentId, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
    }

    // ── Lésions ──────────────────────────────────────────────────────────────

    @Override
    public IncidentInjuryDTO addInjury(Long companyId, Long incidentId, IncidentInjuryDTO dto) throws HSException {
        Incident incident = requireIncident(companyId, incidentId);
        if (dto == null || dto.getOutcome() == null) {
            throw new HSException("INJURY_OUTCOME_REQUIRED");
        }
        if (dto.getLostDays() != null && dto.getLostDays() < 0) {
            throw new HSException("INJURY_LOST_DAYS_NEGATIVE");
        }
        IncidentInjury injury = new IncidentInjury();
        injury.setIncidentId(incidentId);
        injury.setEmployeeId(dto.getEmployeeId());
        injury.setPersonName(dto.getPersonName());
        injury.setOutcome(dto.getOutcome());
        injury.setNatureOfInjury(dto.getNatureOfInjury());
        injury.setBodyPart(dto.getBodyPart());
        injury.setLostDays(dto.getLostDays());
        // company_id estampillé depuis l'incident (source de vérité), jamais du client.
        injury.setCompanyId(incident.getCompanyId());
        injury.setCreatedAt(LocalDateTime.now());
        injury.setUpdatedAt(LocalDateTime.now());
        return enrichName(IncidentInjuryDTO.fromEntity(incidentInjuryRepository.save(injury)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentInjuryDTO> listInjuries(Long companyId, Long incidentId) throws HSException {
        requireIncident(companyId, incidentId);
        List<IncidentInjuryDTO> result = incidentInjuryRepository.findByIncidentId(incidentId).stream()
                .map(IncidentInjuryDTO::fromEntity).collect(Collectors.toList());
        // Résolution best-effort des noms d'employés (batch).
        List<Long> empIds = result.stream().map(IncidentInjuryDTO::getEmployeeId)
                .filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());
        if (!empIds.isEmpty()) {
            try {
                List<EmployeeNameDTO> names = hrmsClient.getEmployeeNameByIds(empIds);
                if (names != null) {
                    Map<Long, String> byId = names.stream()
                            .filter(n -> n.getId() != null && n.getName() != null)
                            .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName, (a, b) -> a));
                    result.forEach(d -> {
                        if (d.getEmployeeId() != null) {
                            d.setEmployeeName(byId.get(d.getEmployeeId()));
                        }
                    });
                }
            } catch (Exception ignore) {
                // best-effort
            }
        }
        return result;
    }

    private IncidentInjuryDTO enrichName(IncidentInjuryDTO d) {
        if (d.getEmployeeId() != null) {
            try {
                List<EmployeeNameDTO> ns = hrmsClient.getEmployeeNameByIds(List.of(d.getEmployeeId()));
                if (ns != null && !ns.isEmpty()) {
                    d.setEmployeeName(ns.get(0).getName());
                }
            } catch (Exception ignore) {
                // best-effort
            }
        }
        return d;
    }

    @Override
    public void deleteInjury(Long companyId, Long injuryId) throws HSException {
        IncidentInjury injury = incidentInjuryRepository.findById(injuryId)
                .orElseThrow(() -> new HSException("INJURY_NOT_FOUND"));
        // Cloisonnement via l'incident porteur.
        requireIncident(companyId, injury.getIncidentId());
        incidentInjuryRepository.delete(injury);
    }

    // ── Heures travaillées ───────────────────────────────────────────────────

    @Override
    public WorkedHoursDTO upsertWorkedHours(Long companyId, WorkedHoursDTO dto) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (dto == null || dto.getYear() == null || dto.getMonth() == null
                || dto.getMonth() < 1 || dto.getMonth() > 12) {
            throw new HSException("WORKED_HOURS_PERIOD_INVALID");
        }
        if (dto.getHours() == null || dto.getHours() < 0) {
            throw new HSException("WORKED_HOURS_INVALID");
        }
        WorkedHours wh = workedHoursRepository
                .findByCompanyIdAndYearAndMonth(companyId, dto.getYear(), dto.getMonth())
                .orElseGet(WorkedHours::new);
        wh.setCompanyId(companyId);
        wh.setYear(dto.getYear());
        wh.setMonth(dto.getMonth());
        wh.setHours(dto.getHours());
        if (wh.getCreatedAt() == null) {
            wh.setCreatedAt(LocalDateTime.now());
        }
        wh.setUpdatedAt(LocalDateTime.now());
        return WorkedHoursDTO.fromEntity(workedHoursRepository.save(wh));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkedHoursDTO> listWorkedHours(Long companyId, int year) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        return workedHoursRepository.findByCompanyIdAndYearOrderByMonthAsc(companyId, year).stream()
                .map(WorkedHoursDTO::fromEntity).collect(Collectors.toList());
    }

    // ── Indicateurs ──────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public SafetyKpiDTO computeKpi(Long companyId, int year) {
        Map<String, Long> breakdown = new LinkedHashMap<>();
        for (InjuryOutcome o : InjuryOutcome.values()) {
            breakdown.put(o.name(), 0L);
        }
        long fatalities = 0;
        long lti = 0;
        long recordable = 0;
        for (IncidentInjuryRepository.OutcomeCount c : incidentInjuryRepository.countByOutcomeForYear(year, companyId)) {
            if (c.getOutcome() == null) {
                continue;
            }
            long n = c.getTotal() != null ? c.getTotal() : 0L;
            breakdown.put(c.getOutcome().name(), n);
            if (c.getOutcome() == InjuryOutcome.FATALITY) {
                fatalities += n;
            }
            if (c.getOutcome().isLostTime()) {
                lti += n;
            }
            if (c.getOutcome().isRecordable()) {
                recordable += n;
            }
        }
        long lostDays = incidentInjuryRepository.sumLostDaysForYear(year, companyId);
        Double hoursObj = workedHoursRepository.sumHoursForYear(year, companyId);
        double hours = hoursObj != null ? hoursObj : 0d;

        Double ltifr = hours > 0 ? (lti * RATE_BASE) / hours : null;
        Double trifr = hours > 0 ? (recordable * RATE_BASE) / hours : null;
        Double severity = hours > 0 ? (lostDays * RATE_BASE) / hours : null;

        return new SafetyKpiDTO(year, hours, fatalities, lti, recordable, lostDays,
                round(ltifr), round(trifr), round(severity), breakdown);
    }

    private Double round(Double v) {
        return v == null ? null : Math.round(v * 100d) / 100d;
    }
}
