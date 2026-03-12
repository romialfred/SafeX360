package com.minexpert.hns.service.inspections;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.GeneralInspectionDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.dto.response.ParticipantResponse;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.inspections.GeneralInspectionRepository;
import com.minexpert.hns.service.planning.ActivityService;
import com.minexpert.hns.utility.StringListConverter;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GeneralInspectionServiceImpl implements GeneralInspectionService {

    private final GeneralInspectionRepository generalInspectionRepository;
    private final HrmsClient hrmsClient;
    private final ActivityService activityService;

    @Override
    public void createGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException {
        generalInspectionDTO.setCreatedAt(LocalDateTime.now());
        generalInspectionDTO.setUpdatedAt(LocalDateTime.now());
        generalInspectionDTO.setStatus(InspectionStatus.PENDING);
        activityService.changeActivityStatusProgress(generalInspectionDTO.getActivityId());
        generalInspectionRepository.save(generalInspectionDTO.toEntity());

    }

    @Override
    public void updateGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException {
        generalInspectionRepository.findById(generalInspectionDTO.getId())
                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
        generalInspectionDTO.setUpdatedAt(LocalDateTime.now());
        generalInspectionRepository.save(generalInspectionDTO.toEntity());
    }

    @Override
    public List<GeneralInspectionResponse> getAllInspections() throws HSException {
        return generalInspectionRepository.findAllInspections();
    }

    @Override
    public GeneralInspectionDetails getInspectionDetailsById(Long id) throws HSException {
        GeneralInspection inspection = generalInspectionRepository.findById(id)
                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
        GeneralInspectionDetails details = inspection.toDetails();
        List<ParticipantResponse> participants = inspection.getParticipants() != null
                ? StringListConverter.convertStringToParticipants(inspection.getParticipants())
                : Arrays.asList();
        List<Long> empIds = participants.stream().map(x -> x.getId())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToDtoMap = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
        participants.forEach(participant -> {
            if (participant.getId() != null) {
                participant.setName(empIdToDtoMap.get(participant.getId()));

            }
        });
        details.setParticipants(participants);
        return details;
    }

    @Override
    public void updateInspectionStatus(Long id, InspectionStatus status) throws HSException {
        GeneralInspection inspection = generalInspectionRepository.findById(id)
                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));

        inspection.setStatus(status);
        inspection.setUpdatedAt(LocalDateTime.now());
        generalInspectionRepository.save(inspection);
    }

    @Override
    public InspectionInfo getInspectionInfoById(Long id) throws HSException {
        return generalInspectionRepository.findInspectionInfo(id)
                .orElseThrow(() -> new HSException("GENERAL_INSPECTION_NOT_FOUND"));
    }

}
