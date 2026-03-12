package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

    private final InvestigationRepository investigationRepository;

    private final CorrectiveActionService correctiveActionService;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;

    @Override
    public Long addInvestigation(InvestActionDTO request) throws HSException {
        InvestigationDTO investigationDTO = request.getInvestigation();
        Optional<Investigation> optional = investigationRepository.findByIncident_Id(investigationDTO.getIncidentId());

        if (optional.isPresent()) {
            throw new HSException("INVESTIGATION_ALREADY_EXISTS");
        }

        request.getCorrectiveActions().forEach(action -> {
            try {
                action.setIncidentId(investigationDTO.getIncidentId());
                correctiveActionService.addCorrectiveAction(action);
            } catch (HSException e) {

            }
        });
        investigationDTO.setCreatedAt(LocalDateTime.now());
        investigationDTO.setUpdatedAt(LocalDateTime.now());
        investigationDTO.setStatus(InvestigationStatus.PENDING);
        investigationDTO.setProgress(0);
        Investigation investigation = investigationDTO.toEntity();
        investigation.setEvidence(mediaService.saveAllMedia(investigationDTO.getEvidence()));
        return investigationRepository.save(investigation).getId();
    }

    @Override
    public InvestResponse getInvestigationByIncidentId(Long incidentId) throws HSException {
        Investigation investigation = investigationRepository.findByIncident_Id(incidentId)
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
    public InvestResponse getInvestigationById(Long id) throws HSException {
        Investigation investigation = investigationRepository.findById(id)
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
    public void updateInvestigation(InvestActionDTO request) throws HSException {
        Investigation investigation = investigationRepository.findById(request.getInvestigation().getId())
                .orElseThrow(() -> new HSException("INVESTIGATION_NOT_FOUND"));
        InvestigationDTO dto = request.getInvestigation();
        request.getCorrectiveActions().forEach(action -> {
            try {
                action.setIncidentId(dto.getIncidentId());
                if (action.getId() != null) {
                    correctiveActionService.updateCorrectiveAction(action);
                } else {
                    correctiveActionService.addCorrectiveAction(action);
                }
            } catch (HSException e) {
            }
        });

        dto.setUpdatedAt(LocalDateTime.now());
        Investigation entity = dto.toEntity();
        entity.setEvidence(mediaService.saveAllMedia(dto.getEvidence()));
        investigationRepository.save(entity).getId();
    }

    @Override
    public List<InvestigationSummary> getAllInvestigations() throws HSException {
        return investigationRepository.findAllInvestigationSummaries();
    }

}
