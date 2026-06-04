package com.minexpert.hns.service.incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.IncidentHistoryDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.response.IncidentHistoryDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.incident.IncidentHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class IncidentHistoryServiceImpl implements IncidentHistoryService {

    private final IncidentHistoryRepository incidentHistoryRepository;
    private final IncidentService incidentService;
    private final HrmsClient hrmsClient;

    @Override
    public Long saveIncidentHistory(Long companyId, IncidentHistoryDTO incidentHistoryDTO) throws HSException {
        incidentHistoryDTO.setCreatedAt(LocalDateTime.now());
        incidentService.updateIncidentStatus(companyId, incidentHistoryDTO.getIncidentId(),
                incidentHistoryDTO.getStatus());
        return incidentHistoryRepository.save(incidentHistoryDTO.toEntity()).getId();
    }

    @Override
    public List<IncidentHistoryDetails> getIncidentHistoryByIncidentId(Long companyId, Long incidentId)
            throws HSException {
        List<IncidentHistoryDetails> details = incidentHistoryRepository.findByIncidentIdAndCompanyId(incidentId,
                companyId);
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
