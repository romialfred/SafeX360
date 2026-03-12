package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.WorkProcessRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkProcessServiceImpl implements WorkProcessService {
    private final WorkProcessRepository workProcessRepository;
    private final HrmsClient hrmsClient;

    @Override
    public Long addWorkProcess(WorkProcessDTO workProcessDTO) throws HSException {
        Optional<WorkProcess> existingWorkProcess = workProcessRepository.findByNameIgnoreCaseAndDepartmentId(
                workProcessDTO.getName(), workProcessDTO.getDepartmentId());
        if (existingWorkProcess.isPresent()) {
            throw new HSException("WORK_PROCESS_ALREADY_EXISTS");
        }
        workProcessDTO.setStatus(Status.ACTIVE);
        workProcessDTO.setCreatedAt(LocalDateTime.now());
        workProcessDTO.setUpdatedAt(LocalDateTime.now());
        return workProcessRepository.save(workProcessDTO.toEntity()).getId();
    }

    @Override
    public void updateWorkProcess(WorkProcessDTO workProcessDTO) throws HSException {
        WorkProcess existingWorkProcess = workProcessRepository.findById(workProcessDTO.getId())
                .orElseThrow(() -> new HSException("WORK_PROCESS_NOT_FOUND"));
        if (!workProcessDTO.getName().equalsIgnoreCase(existingWorkProcess.getName()) ||
                !workProcessDTO.getDepartmentId().equals(existingWorkProcess.getDepartmentId())) {
            Optional<WorkProcess> opt = workProcessRepository.findByNameIgnoreCaseAndDepartmentId(
                    workProcessDTO.getName(), workProcessDTO.getDepartmentId());
            if (opt.isPresent()) {
                throw new HSException("WORK_PROCESS_ALREADY_EXISTS");
            } else {
                existingWorkProcess.setName(workProcessDTO.getName());
                existingWorkProcess.setDepartmentId(workProcessDTO.getDepartmentId());
                existingWorkProcess.setUpdatedAt(LocalDateTime.now());
                workProcessRepository.save(existingWorkProcess);
            }
        }
    }

    @Override
    public void deleteWorkProcess(Long id) throws HSException {
        workProcessRepository.deleteById(id);
    }

    @Override
    public WorkProcessDTO getWorkProcessById(Long id) throws HSException {
        return workProcessRepository.findById(id)
                .map(WorkProcess::toDTO)
                .orElseThrow(() -> new HSException("WORK_PROCESS_NOT_FOUND"));
    }

    @Override
    public List<WorkProcessDTO> getAllWorkProcess() throws HSException {
        List<WorkProcessDTO> processs = ((List<WorkProcess>) workProcessRepository.findAll())
                .stream()
                .map(WorkProcess::toDTO)
                .toList();
        populateDepartmentNames(processs);
        return processs;

    }

    @Override
    public List<WorkProcessDTO> getAllActiveWorkProcess() throws HSException {
        List<WorkProcessDTO> processs = ((List<WorkProcess>) workProcessRepository.findByStatus(Status.ACTIVE))
                .stream()
                .map(WorkProcess::toDTO)
                .toList();
        populateDepartmentNames(processs);
        return processs;
    }

    @Override
    public void activateWorkProcess(Long id) throws HSException {
        WorkProcess workProcess = workProcessRepository.findById(id)
                .orElseThrow(() -> new HSException("WORK_PROCESS_NOT_FOUND"));
        if (workProcess.getStatus() == Status.ACTIVE) {
            throw new HSException("WORK_PROCESS_ALREADY_ACTIVE");
        }
        workProcess.setStatus(Status.ACTIVE);
        workProcess.setUpdatedAt(LocalDateTime.now());
        workProcessRepository.save(workProcess);
    }

    @Override
    public void deactivateWorkProcess(Long id) throws HSException {
        WorkProcess workProcess = workProcessRepository.findById(id)
                .orElseThrow(() -> new HSException("WORK_PROCESS_NOT_FOUND"));
        if (workProcess.getStatus() == Status.INACTIVE) {
            throw new HSException("WORK_PROCESS_ALREADY_INACTIVE");
        }
        workProcess.setStatus(Status.INACTIVE);
        workProcess.setUpdatedAt(LocalDateTime.now());
        workProcessRepository.save(workProcess);
    }

    private void populateDepartmentNames(List<WorkProcessDTO> processs) {
        List<Long> deptIds = processs.stream()
                .map(WorkProcessDTO::getDepartmentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(deptIds);
        Map<Long, String> deptIdToName = deptNames.stream()
                .collect(Collectors.toMap(DepartmentNames::getId, DepartmentNames::getName));

        processs.forEach(process -> {
            if (process.getDepartmentId() != null) {
                process.setDepartmentName(deptIdToName.get(process.getDepartmentId()));
            }
        });
    }
}
