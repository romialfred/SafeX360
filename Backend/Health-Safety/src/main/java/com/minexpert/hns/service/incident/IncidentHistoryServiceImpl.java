package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.IncidentHistoryDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IncidentHistoryServiceImpl implements IncidentHistoryService {

    private final IncidentHistoryRepository incidentHistoryRepository;
    private final IncidentService incidentService;
    private final HrmsClient hrmsClient;

    @Override
    public Long saveIncidentHistory(IncidentHistoryDTO incidentHistoryDTO) throws HSException {
        incidentHistoryDTO.setCreatedAt(LocalDateTime.now());
        incidentService.updateIncidentStatus(incidentHistoryDTO.getIncidentId(), incidentHistoryDTO.getStatus());
        return incidentHistoryRepository.save(incidentHistoryDTO.toEntity()).getId();
    }

    @Override
    public List<IncidentHistoryDetails> getIncidentHistoryByIncidentId(Long incidentId) throws HSException {
        List<IncidentHistoryDetails> details = incidentHistoryRepository.findByIncidentId(incidentId);
        List<Long> empIds = details.stream()
                .map(IncidentHistoryDetails::getOwnerId)
                .distinct()
                .toList();
        if (empIds != null && !empIds.isEmpty()) {
            List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
            Map<Long, String> empNameMap = empNames.stream()
                    .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));
            details.forEach(detail -> {
                String empName = empNameMap.get(detail.getOwnerId());
                if (empName != null) {
                    detail.setOwnerName(empName);
                } else {
                    detail.setOwnerName("Unknown");
                }
            });
        } else {
            details.forEach(detail -> detail.setOwnerName("Unknown"));

        }
        return details;
    }

}
