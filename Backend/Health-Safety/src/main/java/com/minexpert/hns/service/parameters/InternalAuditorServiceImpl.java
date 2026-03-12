package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.InternalAuditorDTO;
import com.minexpert.hns.dto.parameters.InternalAuditorResponse;
import com.minexpert.hns.dto.request.EmployeeDirection;
import com.minexpert.hns.entity.parameters.InternalAuditor;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.InternalAuditorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InternalAuditorServiceImpl implements InternalAuditorService {
    private final InternalAuditorRepository internalAuditorRepository;
    private final HrmsClient hrmsClient;

    @Override
    public Long createInternalAuditor(InternalAuditorDTO internalAuditorDTO) throws HSException {
        Optional<InternalAuditor> optional = internalAuditorRepository
                .findByEmployeeId(internalAuditorDTO.getEmployeeId());
        if (optional.isPresent()) {
            throw new HSException("INTERNAL_AUDITOR_ALREADY_EXISTS");
        }

        internalAuditorDTO.setCreatedAt(LocalDateTime.now());
        internalAuditorDTO.setUpdatedAt(LocalDateTime.now());
        internalAuditorDTO.setStatus(Status.ACTIVE);

        return internalAuditorRepository.save(internalAuditorDTO.toEntity()).getId();
    }

    @Override
    public void updateInternalAuditor(InternalAuditorDTO internalAuditorDTO) throws HSException {
        Optional<InternalAuditor> optional = internalAuditorRepository
                .findByEmployeeId(internalAuditorDTO.getEmployeeId());
        if (optional.isEmpty()) {
            throw new HSException("INTERNAL_AUDITOR_NOT_FOUND");
        }

        InternalAuditor internalAuditor = optional.get();
        internalAuditor.setRole(internalAuditorDTO.getRole());
        internalAuditor.setStatus(internalAuditorDTO.getStatus());
        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    public void activateInternalAuditor(Long id) throws HSException {
        Optional<InternalAuditor> optional = internalAuditorRepository.findById(id);
        if (optional.isEmpty()) {
            throw new HSException("INTERNAL_AUDITOR_NOT_FOUND");
        }

        InternalAuditor internalAuditor = optional.get();
        internalAuditor.setStatus(Status.ACTIVE);
        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    public void deactivateInternalAuditor(Long id) throws HSException {
        Optional<InternalAuditor> optional = internalAuditorRepository.findById(id);
        if (optional.isEmpty()) {
            throw new HSException("INTERNAL_AUDITOR_NOT_FOUND");
        }

        InternalAuditor internalAuditor = optional.get();
        internalAuditor.setStatus(Status.INACTIVE);
        internalAuditor.setUpdatedAt(LocalDateTime.now());

        internalAuditorRepository.save(internalAuditor);
    }

    @Override
    public List<InternalAuditorResponse> getAllInternalAuditors() throws HSException {
        List<InternalAuditor> auditors = (List<InternalAuditor>) internalAuditorRepository.findAll();
        List<Long> employeeIds = auditors.stream()
                .map(InternalAuditor::getEmployeeId)
                .toList();

        List<EmployeeDirection> employeeDirections = hrmsClient.getEmployeeWithDirection(employeeIds);
        Map<Long, EmployeeDirection> directMap = employeeDirections.stream()
                .collect(Collectors.toMap(EmployeeDirection::getId, Function.identity()));
        return auditors.stream()
                .map(auditor -> {
                    return new InternalAuditorResponse(auditor.getId(), auditor.getEmployeeId(),
                            directMap.get(auditor.getEmployeeId()).getName(),
                            directMap.get(auditor.getEmployeeId()).getEmail(),
                            directMap.get(auditor.getEmployeeId()).getDepartment(),
                            directMap.get(auditor.getEmployeeId()).getDirection(),
                            auditor.getRole(),
                            auditor.getStatus(),
                            auditor.getCreatedAt(),
                            auditor.getUpdatedAt());
                })
                .toList();

    }

}
