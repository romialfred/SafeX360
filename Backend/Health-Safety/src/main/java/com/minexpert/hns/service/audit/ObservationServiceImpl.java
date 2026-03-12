package com.minexpert.hns.service.audit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.audit.ObservationDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.ObsTitle;
import com.minexpert.hns.entity.audit.EmpInterview;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ObservationServiceImpl implements ObservationService {

    private final ObservationRepository observationRepository;
    private final MediaService mediaService;
    private final HrmsClient hrmsClient;

    @Override
    public Long createObservation(ObservationDTO observationDTO) throws HSException {
        observationDTO.setCreatedAt(LocalDateTime.now());
        observationDTO.setUpdatedAt(LocalDateTime.now());
        Observation observation = observationDTO.toEntity();
        observation.setEvidence(mediaService.saveAllMedia(observationDTO.getEvidence()));
        return observationRepository.save(observation).getId();
    }

    @Override
    public void updateObservation(ObservationDTO observationDTO) throws HSException {

        // Observation observation =
        // observationRepository.findById(observationDTO.getId())
        // .orElseThrow(() -> new HSException("OBSERVATION_NOT_FOUND"));
        // observationRepository.save(observation);
    }

    @Override
    public List<ObservationDTO> getAllObservationsByAuditId(Long auditId) throws HSException {
        List<Observation> observations = observationRepository.findByAudit_Id(auditId);

        List<Long> employeeIds = observations.stream()
                .flatMap(o -> {
                    List<EmpInterview> interviews = o.getInterviews();
                    return interviews != null ? interviews.stream() : Stream.empty();
                })
                .map((x) -> x.getId())
                .distinct()
                .toList();
        List<EmployeeNameDTO> employeeNames = hrmsClient.getEmployeeNameByIds(employeeIds);
        Map<Long, String> employeeNameMap = employeeNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        return observations.stream()
                .map((x) -> {
                    ObservationDTO dto = x.toDTO();
                    dto.setEvidence(mediaService.getAllMediaByArray(x.getEvidence()));
                    if (x.getInterviews() != null) {
                        dto.setInterviews(x.getInterviews().stream()
                                .map((interview) -> {
                                    return new EmpInterview(interview.getId(), employeeNameMap.get(interview.getId()),
                                            interview.getDate());
                                }).toList());
                    }
                    return dto;
                })
                .toList();
    }

    @Override
    public List<ObsTitle> getObservationTitlesByAuditId(Long auditId) throws HSException {
        return observationRepository.findTitlesByAuditId(auditId);
    }

}
