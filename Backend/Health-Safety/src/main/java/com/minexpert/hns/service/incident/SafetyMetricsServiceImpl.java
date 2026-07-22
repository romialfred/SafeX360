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
import com.minexpert.hns.dto.WorkedHoursEntryDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.SafetyKpiDTO;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentInjury;
import com.minexpert.hns.entity.incident.WorkedHours;
import com.minexpert.hns.entity.incident.WorkedHoursEntry;
import com.minexpert.hns.enums.InjuryOutcome;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentInjuryRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.WorkedHoursEntryRepository;
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
    private WorkedHoursEntryRepository workedHoursEntryRepository;
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

    // ── Heures travaillées DÉTAILLÉES (par département / sous-traitant) ────────

    @Override
    @Transactional(readOnly = true)
    public List<WorkedHoursEntryDTO> listWorkedHoursEntries(Long companyId, int year) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        return workedHoursEntryRepository.findByCompanyIdAndYearOrderByMonthAsc(companyId, year).stream()
                .map(WorkedHoursEntryDTO::fromEntity).collect(Collectors.toList());
    }

    @Override
    public WorkedHoursEntryDTO upsertWorkedHoursEntry(Long companyId, WorkedHoursEntryDTO dto) throws HSException {
        if (companyId == null) {
            // Cloisonnement : une ligne d'heures appartient à UNE mine précise (pas
            // de saisie en vue consolidée — cf. doctrine « pas de sélecteur de mine »,
            // la mine = celle du bandeau).
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (dto == null || dto.getYear() == null || dto.getMonth() == null
                || dto.getMonth() < 1 || dto.getMonth() > 12) {
            throw new HSException("WORKED_HOURS_PERIOD_INVALID");
        }
        if (dto.getHours() == null || dto.getHours() < 0) {
            throw new HSException("WORKED_HOURS_INVALID");
        }
        boolean isDept = dto.getDepartmentId() != null;
        boolean isSub = dto.getSubcontractorName() != null && !dto.getSubcontractorName().isBlank();
        if (isDept == isSub) {
            // EXACTEMENT un périmètre : soit un département, soit un sous-traitant.
            throw new HSException("WORKED_HOURS_SCOPE_REQUIRED");
        }
        WorkedHoursEntry e;
        if (isDept) {
            e = workedHoursEntryRepository
                    .findByCompanyIdAndYearAndMonthAndDepartmentId(companyId, dto.getYear(), dto.getMonth(), dto.getDepartmentId())
                    .orElseGet(WorkedHoursEntry::new);
            e.setLaborType("DEPARTMENT");
            e.setDepartmentId(dto.getDepartmentId());
            e.setSubcontractorName(null);
        } else {
            String name = dto.getSubcontractorName().trim();
            e = workedHoursEntryRepository
                    .findByCompanyIdAndYearAndMonthAndSubcontractorName(companyId, dto.getYear(), dto.getMonth(), name)
                    .orElseGet(WorkedHoursEntry::new);
            e.setLaborType("SUBCONTRACTOR");
            e.setSubcontractorName(name);
            e.setDepartmentId(null);
        }
        e.setCompanyId(companyId);
        e.setYear(dto.getYear());
        e.setMonth(dto.getMonth());
        e.setHours(dto.getHours());
        if (e.getCreatedAt() == null) {
            e.setCreatedAt(LocalDateTime.now());
        }
        e.setUpdatedAt(LocalDateTime.now());
        return WorkedHoursEntryDTO.fromEntity(workedHoursEntryRepository.save(e));
    }

    @Override
    public void deleteWorkedHoursEntry(Long companyId, Long entryId) throws HSException {
        WorkedHoursEntry e = workedHoursEntryRepository.findById(entryId)
                .orElseThrow(() -> new HSException("WORKED_HOURS_ENTRY_NOT_FOUND"));
        if (companyId != null && e.getCompanyId() != null && !companyId.equals(e.getCompanyId())) {
            throw new HSException("WORKED_HOURS_ENTRY_NOT_FOUND");
        }
        workedHoursEntryRepository.delete(e);
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
        // Dénominateur compilé depuis les heures DÉTAILLÉES (département + sous-traitant).
        Double hoursObj = workedHoursEntryRepository.sumHoursForYear(year, companyId);
        double hours = hoursObj != null ? hoursObj : 0d;

        Double ltifr = hours > 0 ? (lti * RATE_BASE) / hours : null;
        Double trifr = hours > 0 ? (recordable * RATE_BASE) / hours : null;
        Double severity = hours > 0 ? (lostDays * RATE_BASE) / hours : null;

        // ── Série mensuelle (variations mois-à-mois des tuiles) ──
        double[] mHours = new double[13];
        for (WorkedHoursEntryRepository.MonthHours mh : workedHoursEntryRepository.sumHoursByMonthForYear(year, companyId)) {
            if (mh.getMonth() != null && mh.getMonth() >= 1 && mh.getMonth() <= 12) {
                mHours[mh.getMonth()] = mh.getTotal() != null ? mh.getTotal() : 0d;
            }
        }
        long[] mLti = new long[13];
        long[] mRec = new long[13];
        for (IncidentInjuryRepository.MonthOutcomeCount c : incidentInjuryRepository.countByMonthAndOutcomeForYear(year, companyId)) {
            if (c.getMonth() == null || c.getOutcome() == null || c.getMonth() < 1 || c.getMonth() > 12) {
                continue;
            }
            long n = c.getTotal() != null ? c.getTotal() : 0L;
            if (c.getOutcome().isLostTime()) {
                mLti[c.getMonth()] += n;
            }
            if (c.getOutcome().isRecordable()) {
                mRec[c.getMonth()] += n;
            }
        }
        long[] mDays = new long[13];
        for (IncidentInjuryRepository.MonthLostDays d : incidentInjuryRepository.sumLostDaysByMonthForYear(year, companyId)) {
            if (d.getMonth() != null && d.getMonth() >= 1 && d.getMonth() <= 12) {
                mDays[d.getMonth()] = d.getTotal() != null ? d.getTotal() : 0L;
            }
        }
        List<SafetyKpiDTO.MonthlyKpi> monthly = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            double h = mHours[m];
            Double mLtifr = h > 0 ? round((mLti[m] * RATE_BASE) / h) : null;
            Double mTrifr = h > 0 ? round((mRec[m] * RATE_BASE) / h) : null;
            Double mSev = h > 0 ? round((mDays[m] * RATE_BASE) / h) : null;
            monthly.add(new SafetyKpiDTO.MonthlyKpi(m, h, mLti[m], mRec[m], mDays[m], mLtifr, mTrifr, mSev));
        }

        return new SafetyKpiDTO(year, hours, fatalities, lti, recordable, lostDays,
                round(ltifr), round(trifr), round(severity), breakdown, monthly);
    }

    private Double round(Double v) {
        return v == null ? null : Math.round(v * 100d) / 100d;
    }
}
