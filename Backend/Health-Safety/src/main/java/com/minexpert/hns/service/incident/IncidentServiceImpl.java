package com.minexpert.hns.service.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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
public class IncidentServiceImpl implements IncidentService {
    private static final String[] MONTH_LABELS = { "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" };

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
    public void reportIncident(IncidentDTO incidentDTO) {
        // incidentDTO.setStatus(IncidentStatus.REPORTED);

        Incident incident = incidentDTO.toIncident();
        incident.setNumber(generateIncidentNumber());
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
    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAllIncidentsWithMaxSeverity();
    }

    @Override
    public void updateIncident(IncidentDTO incidentDTO) throws HSException {

        // incident
        Incident incident = incidentRepository.findById(incidentDTO.getId())
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
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
    public IncidentDTO getIncidentById(Long id) throws HSException {
        Incident incident = incidentRepository.findById(id)
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
    public IncidentResponse getIncidentResponseById(Long id) throws HSException {
        return incidentRepository.findByIncidentId(id)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
    }

    @Override
    public void updateIncidentStatus(Long id, IncidentStatus status) throws HSException {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_NOT_FOUND"));
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());
        incidentRepository.save(incident);
    }

    @Override
    public List<YearlyClosureData> getYearlyClosureData(int year) {
        List<MonthlyClosureSummary> summaries = incidentRepository.findMonthlyClosureSummaryByYear(year);

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
    public DepartmentIncidentStats getDepartmentIncidentStats(Long departmentId) {
        LocalDateTime windowEnd = LocalDateTime.now();
        LocalDateTime windowStart = windowEnd.minusDays(30);

        if (departmentId == null) {
            return new DepartmentIncidentStats(null, windowStart, windowEnd, 0L, 0L, 0L);
        }

        long incidentCount = incidentRepository
                .countByDepartmentIdAndCreatedAtGreaterThanEqual(departmentId, windowStart);

        long completedInvestigations = investigationRepository
                .countByStatusAndIncident_DepartmentIdAndUpdatedAtGreaterThanEqual(InvestigationStatus.COMPLETED,
                        departmentId, windowStart);

        LocalDate today = windowEnd.toLocalDate();
        LocalDate deadlineStart = today.minusDays(30);

        long correctiveActionCount = correctiveActionRepository.countByDepartmentIdAndStatusInAndDeadlineBetween(
                departmentId,
                List.of(ActionStatus.PENDING, ActionStatus.IN_PROGRESS),
                deadlineStart,
                today);

        return new DepartmentIncidentStats(departmentId, windowStart, windowEnd, incidentCount, completedInvestigations,
                correctiveActionCount);
    }

    private String generateIncidentNumber() {
        int currentYear = Year.now().getValue();

        // Fetch last incident for the current year
        Pageable limitOne = PageRequest.of(0, 1);
        List<Incident> latestIncidents = incidentRepository.findTopByYearOrderByIdDesc(currentYear, limitOne);

        int nextNumber = 1;
        if (!latestIncidents.isEmpty()) {
            String lastNumber = latestIncidents.get(0).getNumber(); // INC-2025-000123
            String[] parts = lastNumber.split("-");
            if (parts.length == 3) {
                nextNumber = Integer.parseInt(parts[2]) + 1;
            }
        }

        return String.format("INC-%d-%06d", currentYear, nextNumber);
    }

}
