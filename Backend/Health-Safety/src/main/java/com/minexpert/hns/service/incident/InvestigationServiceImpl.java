package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.InvestActionDTO;
import com.minexpert.hns.dto.InvestigationDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.InvestResponse;
import com.minexpert.hns.dto.response.InvestigationSummary;
import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.enums.InvestigationStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.InvestigationRepository;
import com.minexpert.hns.service.MediaService;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InvestigationServiceImpl implements InvestigationService {

    public static final String CACHE_INVESTIGATION_BY_INCIDENT = "investigationByIncident";
    public static final String CACHE_INVESTIGATION_BY_ID = "investigationById";
    public static final String CACHE_INVESTIGATIONS_ALL = "investigationsAll";

    private final InvestigationRepository investigationRepository;

    private final CorrectiveActionService correctiveActionService;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #request.investigation.incidentId) : 'ALL-' + #request.investigation.incidentId"),
            // @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = CACHE_INVESTIGATIONS_ALL, allEntries = true),
            @CacheEvict(cacheNames = IncidentServiceImpl.CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public Long addInvestigation(Long companyId, InvestActionDTO request) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        InvestigationDTO investigationDTO = request.getInvestigation();
        if (investigationDTO == null) {
            throw new HSException("INVESTIGATION_DETAILS_REQUIRED");
        }
        investigationDTO.setCompanyId(companyId);
        Optional<Investigation> optional = investigationRepository
                .findByIncidentIdWithCompanyContext(investigationDTO.getIncidentId(), companyId);

        if (optional.isPresent()) {
            throw new HSException("INVESTIGATION_ALREADY_EXISTS");
        }

        if (request.getCorrectiveActions() != null) {
            request.getCorrectiveActions().forEach(action -> {
                try {
                    action.setIncidentId(investigationDTO.getIncidentId());
                    action.setCompanyId(companyId);
                    correctiveActionService.addCorrectiveAction(companyId, action);
                } catch (HSException e) {

                }
            });
        }
        investigationDTO.setCreatedAt(LocalDateTime.now());
        investigationDTO.setUpdatedAt(LocalDateTime.now());
        investigationDTO.setStatus(InvestigationStatus.PENDING);
        investigationDTO.setProgress(0);
        Investigation investigation = investigationDTO.toEntity();
        investigation.setEvidence(mediaService.saveAllMedia(investigationDTO.getEvidence()));
        return investigationRepository.save(investigation).getId();
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #incidentId) : 'ALL-' + #incidentId")
    public InvestResponse getInvestigationByIncidentId(Long companyId, Long incidentId) throws HSException {
        Investigation investigation = investigationRepository
                .findByIncidentIdWithCompanyContext(incidentId, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        InvestResponse investResponse = investigation.toResponse();
        investResponse.setEvidence(mediaService.getAllMediaByArray(investigation.getEvidence()));
        List<Long> empIds = StringListConverter.convertStringToParticipants(investigation.getTeam()).stream()
                .map(ParticipantResponse::getId).toList();
        List<EmployeeNameDTO> participants = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, EmployeeNameDTO> empNumberMap = participants.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, e -> e));
        investResponse.setTeam(investResponse.getTeam().stream()
                .map(participant -> {
                    EmployeeNameDTO emp = empNumberMap.get(participant.getId());
                    if (emp != null) {
                        participant.setName(emp.getName());
                        participant.setEmpNumber(emp.getEmpNumber());
                    }
                    return participant;
                })
                .toList());
        return investResponse;
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public InvestResponse getInvestigationById(Long companyId, Long id) throws HSException {
        Investigation investigation = investigationRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        InvestResponse investResponse = investigation.toResponse();
        investResponse.setEvidence(mediaService.getAllMediaByArray(investigation.getEvidence()));
        List<Long> empIds = StringListConverter.convertStringToParticipants(investigation.getTeam()).stream()
                .map(ParticipantResponse::getId).toList();
        List<EmployeeNameDTO> participants = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, EmployeeNameDTO> empNumberMap = participants.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, e -> e));
        investResponse.setTeam(investResponse.getTeam().stream()
                .map(participant -> {
                    EmployeeNameDTO emp = empNumberMap.get(participant.getId());
                    if (emp != null) {
                        participant.setName(emp.getName());
                        participant.setEmpNumber(emp.getEmpNumber());
                    }
                    return participant;
                })
                .toList());
        return investResponse;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_INCIDENT, key = "#companyId != null ? (#companyId + '-' + #request.investigation.incidentId) : 'ALL-' + #request.investigation.incidentId"),
            @CacheEvict(cacheNames = CACHE_INVESTIGATION_BY_ID, key = "#companyId != null ? (#companyId + '-' + #request.investigation.id) : 'ALL-' + #request.investigation.id"),
            @CacheEvict(cacheNames = CACHE_INVESTIGATIONS_ALL, allEntries = true),
            @CacheEvict(cacheNames = IncidentServiceImpl.CACHE_DEPARTMENT_INCIDENT_STATS, allEntries = true)
    })
    public void updateInvestigation(Long companyId, InvestActionDTO request) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        InvestigationDTO dto = request.getInvestigation();
        if (dto == null) {
            throw new HSException("INVESTIGATION_DETAILS_REQUIRED");
        }
        dto.setCompanyId(companyId);
        Investigation investigation = investigationRepository
                .findByIdWithCompanyContext(dto.getId(), companyId)
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        if (request.getCorrectiveActions() != null) {
            request.getCorrectiveActions().forEach(action -> {
                try {
                    action.setIncidentId(dto.getIncidentId());
                    action.setCompanyId(companyId);
                    if (action.getId() != null) {
                        correctiveActionService.updateCorrectiveAction(companyId, action);
                    } else {
                        correctiveActionService.addCorrectiveAction(companyId, action);
                    }
                } catch (HSException e) {
                }
            });
        }

        dto.setUpdatedAt(LocalDateTime.now());
        Investigation entity = dto.toEntity();
        entity.setEvidence(mediaService.saveAllMedia(dto.getEvidence()));
        investigationRepository.save(entity).getId();
    }

    @Override
    @Cacheable(cacheNames = CACHE_INVESTIGATIONS_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<InvestigationSummary> getAllInvestigations(Long companyId) throws HSException {
        return investigationRepository.findAllInvestigationSummaries(companyId);
    }

}
