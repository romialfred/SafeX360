package com.minexpert.hns.service.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.IncidentAnalysis;
import com.minexpert.hns.entity.incident.IncidentDetail;
import com.minexpert.hns.entity.incident.RiskAssessment;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.enums.InvestigationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;
import com.minexpert.hns.repository.incident.IncidentAnalysisRepository;
import com.minexpert.hns.repository.incident.IncidentDetailRepository;
import com.minexpert.hns.repository.incident.IncidentRepository;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.repository.incident.RiskAssessmentRepository;
import com.minexpert.hns.repository.incident.projection.MonthlyClosureSummary;
import com.minexpert.hns.service.MediaService;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    public static final String CACHE_INCIDENTS_ALL = "incidentsAll";
    public static final String CACHE_INCIDENT_BY_ID = "incidentById";
    public static final String CACHE_INCIDENT_RESPONSE_BY_ID = "incidentResponseById";
    public static final String CACHE_INCIDENT_YEARLY_CLOSURE = "incidentYearlyClosure";
    public static final String CACHE_DEPARTMENT_INCIDENT_STATS = "departmentIncidentStats";
    private static final String[] MONTH_LABELS = { "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept",
            "Oct", "Nov", "Dec" };

    @Autowired
    private IncidentRepository incidentRepository;
    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private IncidentAnalysisRepository incidentAnalysisRepository;
    @Autowired
    private IncidentDetailRepository incidentDetailRepository;

    @Autowired
    private MediaService mediaService;

    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;

    @Autowired
    private HrmsClient hrmsClient;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private InvestigationRepository investigationRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            // @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAILS_BY_INCIDENT, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_SEVERITY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_CATEGORY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_CATEGORY_SEVERITY_COUNTS, allEntries = true)
    })
    public void reportIncident(Long companyId, IncidentDTO incidentDTO) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        // Statut initial par défaut : un incident sans statut sort en 'UNKNOWN'
        // dans les projections (CASE ... ELSE) et échappe à tous les filtres.
        if (incidentDTO.getStatus() == null) {
            incidentDTO.setStatus(IncidentStatus.PENDING);
        }

        incidentDTO.setCompanyId(companyId);
        Incident incident = incidentDTO.toIncident();
        incident.setNumber(generateIncidentNumber(companyId));
        incident.setCreatedAt(LocalDateTime.now());
        incident.setUpdatedAt(LocalDateTime.now());
        incident.setEvidence(mediaService.saveAllMedia(incidentDTO.getEvidence()));
        Incident savedIncident = incidentRepository.save(incident);

        // Incident Analysis

        IncidentAnalysis incidentAnalysis = incidentDTO.toIncidentAnalysis();
        incidentAnalysis.setIncident(savedIncident);

        incidentAnalysis.setCreatedAt(LocalDateTime.now());
        incidentAnalysis.setUpdatedAt(LocalDateTime.now());
        incidentAnalysisRepository.save(incidentAnalysis);

        // incident Detail
        if (incidentDTO.getIncidentDetails() != null) {
            incidentDTO.getIncidentDetails().forEach(incidentDetailDTO -> {
                incidentDetailDTO.setIncidentId(savedIncident.getId());
                incidentDetailDTO.setCreatedAt(LocalDateTime.now());
                incidentDetailDTO.setUpdatedAt(LocalDateTime.now());
                incidentDetailRepository.save(incidentDetailDTO.toEntity());
            });
        }
        // RiskAssement
        RiskAssessment riskAssessment = incidentDTO.toRiskAssessment();
        riskAssessment.setIncident(savedIncident);
        riskAssessment.setCreatedAt(LocalDateTime.now());
        riskAssessment.setUpdatedAt(LocalDateTime.now());
        riskAssessmentRepository.save(riskAssessment);
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENTS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentResponse> getAllIncidents(Long companyId) {
        return incidentRepository.findAllIncidentsWithMaxSeverity(companyId);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #incidentDTO.id) : 'ALL-' + #incidentDTO.id"),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #incidentDTO.id) : 'ALL-' + #incidentDTO.id"),
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAILS_BY_INCIDENT, key = "#incidentDTO.id"),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_SEVERITY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_CATEGORY_COUNTS, allEntries = true),
            @CacheEvict(cacheNames = IncidentDetailServiceIImpl.CACHE_INCIDENT_DETAIL_CATEGORY_SEVERITY_COUNTS, allEntries = true)
    })
    public void updateIncident(Long companyId, IncidentDTO incidentDTO) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }

        // incident
        Incident incident = incidentRepository.findByIdAndCompanyId(incidentDTO.getId(), companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        incidentDTO.setCompanyId(companyId);
        Incident updatedIncident = incidentDTO.toIncident();
        updatedIncident.setStatus(incident.getStatus());
        updatedIncident.setCreatedAt(incident.getCreatedAt());
        updatedIncident.setUpdatedAt(LocalDateTime.now());
        updatedIncident.setEvidence(mediaService.saveAllMedia(incidentDTO.getEvidence()));
        incidentRepository.save(updatedIncident);

        // incident Analysis

        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(incidentDTO.getId());

        IncidentAnalysis incidentAnalysis = incidentDTO.toIncidentAnalysis();
        incidentAnalysis.setIncident(new Incident(incidentDTO.getId()));

        incidentAnalysis.setUpdatedAt(LocalDateTime.now());
        incidentAnalysis.setCreatedAt(LocalDateTime.now());

        if (optional.isPresent()) {
            incidentAnalysis.setId(optional.get().getId());
            incidentAnalysis.setCreatedAt(optional.get().getCreatedAt());
        }
        incidentAnalysisRepository.save(incidentAnalysis);

        // incident Detail
        if (incidentDTO.getIncidentDetails() != null) {
            incidentDTO.getIncidentDetails().forEach(incidentDetailDTO -> {
                incidentDetailDTO.setIncidentId(incidentDTO.getId());
                incidentDetailDTO.setUpdatedAt(LocalDateTime.now());
                if (incidentDetailDTO.getId() == null) {
                    incidentDetailDTO.setCreatedAt(LocalDateTime.now());
                } else {
                    Optional<IncidentDetail> existingDetail = incidentDetailRepository
                            .findById(incidentDetailDTO.getId());
                    if (existingDetail.isPresent()) {
                        incidentDetailDTO.setCreatedAt(existingDetail.get().getCreatedAt());
                    }
                }
                incidentDetailRepository.save(incidentDetailDTO.toEntity());
            });
        }
        // RiskAssement
        RiskAssessment riskAssessment = incidentDTO.toRiskAssessment();
        riskAssessment.setIncident(new Incident(incidentDTO.getId()));
        riskAssessment.setUpdatedAt(LocalDateTime.now());
        Optional<RiskAssessment> riskAssessmentOptional = riskAssessmentRepository.findById(incidentDTO.getId());
        if (riskAssessmentOptional.isPresent()) {
            riskAssessment.setId(riskAssessmentOptional.get().getId());
            riskAssessment.setCreatedAt(riskAssessmentOptional.get().getCreatedAt());
        }
        riskAssessmentRepository.save(riskAssessment);

    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentDTO getIncidentById(Long companyId, Long id) throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        IncidentDTO incidentDTO = incident.toDTO();
        incidentDTO.setEvidence(mediaService.getAllMediaByArray(incident.getEvidence()));
        Optional<IncidentAnalysis> optional = incidentAnalysisRepository.findByIncidentId(id);
        if (optional.isPresent()) {
            IncidentAnalysis incidentAnalysis = optional.get();
            incidentDTO = incidentAnalysis.toIncidentDTO(incidentDTO);
        }
        if (incident.getDepartmentId() != null) {
            List<DepartmentNames> departmentNames = hrmsClient.getDepartmentNames(List.of(incident.getDepartmentId()));
            if (!departmentNames.isEmpty()) {
                incidentDTO.setDepartmentName(departmentNames.get(0).getName());
            }
        }
        List<IncidentDetail> incidentDetails = incidentDetailRepository.findByIncidentId(id);
        incidentDTO.setIncidentDetails(incidentDetails.stream()
                .map(IncidentDetail::toDTO)
                .toList());
        RiskAssessment riskAssessment = riskAssessmentRepository.findById(id)
                .orElse(null);
        if (riskAssessment != null) {
            incidentDTO = riskAssessment.toIncidentDTO(incidentDTO);
        }
        return incidentDTO;
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentResponse getIncidentResponseById(Long companyId, Long id) throws HSException {
        return incidentRepository.findByIncidentId(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INCIDENT_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = CACHE_INCIDENT_RESPONSE_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = CACHE_INCIDENTS_ALL, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, allEntries = true),
            @CacheEvict(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public void updateIncidentStatus(Long companyId, Long id, IncidentStatus status) throws HSException {
        Incident incident = incidentRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        assertIncidentTransition(incident.getStatus(), status);
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());
        incidentRepository.save(incident);
    }

    private static final Map<IncidentStatus, Set<IncidentStatus>> INCIDENT_TRANSITIONS = Map.of(
            IncidentStatus.PENDING, Set.of(IncidentStatus.REPORTED, IncidentStatus.REJECTED),
            IncidentStatus.REPORTED, Set.of(IncidentStatus.INVESTIGATION, IncidentStatus.CLOSED, IncidentStatus.REJECTED),
            IncidentStatus.INVESTIGATION, Set.of(IncidentStatus.INVESTIGATION_COMPLETED),
            IncidentStatus.INVESTIGATION_COMPLETED, Set.of(IncidentStatus.CORRECTIVE_ACTIONS, IncidentStatus.CLOSED),
            IncidentStatus.CORRECTIVE_ACTIONS, Set.of(IncidentStatus.CLOSED),
            IncidentStatus.CLOSED, Set.of(),
            IncidentStatus.REJECTED, Set.of()
    );

    private void assertIncidentTransition(IncidentStatus current, IncidentStatus target) throws HSException {
        if (!INCIDENT_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new HSException("INVALID_STATUS_TRANSITION");
        }
    }

    @Override
    @Cacheable(cacheNames = CACHE_INCIDENT_YEARLY_CLOSURE, key = "#companyId != null ? (#companyId + '-' + #year) : 'ALL-' + #year")
    public List<YearlyClosureData> getYearlyClosureData(Long companyId, int year) {
        List<MonthlyClosureSummary> summaries = incidentRepository.findMonthlyClosureSummaryByYear(year, companyId);

        Map<Integer, MonthlyClosureSummary> summaryByMonth = summaries.stream()
                .filter(summary -> summary.getMonth() != null)
                .collect(Collectors.toMap(MonthlyClosureSummary::getMonth, summary -> summary,
                        (current, ignore) -> current));

        return IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    MonthlyClosureSummary summary = summaryByMonth.get(month);
                    long totalIncidents = summary != null && summary.getTotalIncidents() != null
                            ? summary.getTotalIncidents()
                            : 0L;
                    long closedIncidents = summary != null && summary.getClosedIncidents() != null
                            ? summary.getClosedIncidents()
                            : 0L;
                    return new YearlyClosureData(MONTH_LABELS[month - 1], totalIncidents, closedIncidents);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = CACHE_DEPARTMENT_INCIDENT_STATS, key = "#companyId != null ? (#companyId + '-' + #departmentId) : 'ALL-' + #departmentId")
    public DepartmentIncidentStats getDepartmentIncidentStats(Long companyId, Long departmentId) {
        LocalDateTime windowEnd = LocalDateTime.now();
        LocalDateTime windowStart = windowEnd.minusDays(30);

        if (departmentId == null) {
            return new DepartmentIncidentStats(null, windowStart, windowEnd, 0L, 0L, 0L);
        }

        long incidentCount = companyId != null
                ? incidentRepository.countByCompanyIdAndDepartmentIdAndCreatedAtGreaterThanEqual(companyId,
                        departmentId, windowStart)
                : incidentRepository.countByDepartmentIdAndCreatedAtGreaterThanEqual(departmentId, windowStart);

        long completedInvestigations = companyId != null
                ? investigationRepository
                        .countByStatusAndIncident_CompanyIdAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(
                                InvestigationStatus.COMPLETED,
                                companyId,
                                departmentId,
                                windowStart)
                : investigationRepository.countByStatusAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(
                        InvestigationStatus.COMPLETED,
                        departmentId,
                        windowStart);

        LocalDate today = windowEnd.toLocalDate();
        LocalDate deadlineStart = today.minusDays(30);

        long correctiveActionCount = companyId != null
                ? correctiveActionRepository.countByIncident_CompanyIdAndDepartmentIdAndStatusInAndDeadlineBetween(
                        companyId,
                        departmentId,
                        List.of(ActionStatus.PENDING, ActionStatus.IN_PROGRESS),
                        deadlineStart,
                        today)
                : correctiveActionRepository.countByDepartmentIdAndStatusInAndDeadlineBetween(
                        departmentId,
                        List.of(ActionStatus.PENDING, ActionStatus.IN_PROGRESS),
                        deadlineStart,
                        today);

        return new DepartmentIncidentStats(departmentId, windowStart, windowEnd, incidentCount, completedInvestigations,
                correctiveActionCount);
    }

    private String generateIncidentNumber(Long companyId) {
        int currentYear = Year.now().getValue();
        String prefix = "INC-" + currentYear + "-";

        // Repart de la séquence du format standard de l'année (INC-YYYY-NNNNNN).
        // On NE se base PLUS sur « le dernier incident de l'année par id » : ce
        // dernier peut porter un autre format (ex. INC-SYR-2026-0014, 4 segments),
        // ce qui cassait le parsing et réinitialisait le compteur à 1 -> doublon
        // sur INC-YYYY-000001 -> 500 (aucune mine « neuve » ne pouvait déclarer).
        int nextNumber = 1;
        Optional<Incident> last = incidentRepository.findFirstByNumberStartingWithOrderByNumberDesc(prefix);
        if (last.isPresent()) {
            String[] parts = last.get().getNumber().split("-");
            try {
                nextNumber = Integer.parseInt(parts[parts.length - 1].trim()) + 1;
            } catch (NumberFormatException ex) {
                nextNumber = 1;
            }
        }

        // Garantie d'unicité (contrainte UNIQUE globale) : on avance jusqu'à un
        // numéro réellement libre — plus jamais de DataIntegrityViolation.
        String candidate = String.format("%s%06d", prefix, nextNumber);
        while (incidentRepository.existsByNumber(candidate)) {
            nextNumber++;
            candidate = String.format("%s%06d", prefix, nextNumber);
        }
        return candidate;
    }

}
