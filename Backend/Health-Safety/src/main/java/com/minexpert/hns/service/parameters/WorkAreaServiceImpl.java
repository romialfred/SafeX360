package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.WorkAreaDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.WorkAreaRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class WorkAreaServiceImpl implements WorkAreaService {

    private final WorkAreaRepository workAreaRepository;
    private final HrmsClient hrmsClient;

    @Override
    public Long addWorkArea(WorkAreaDTO workAreaDTO) throws HSException {
        Optional<WorkArea> existingWorkArea = workAreaRepository.findByNameIgnoreCaseAndDepartmentId(
                workAreaDTO.getName(), workAreaDTO.getDepartmentId());
        if (existingWorkArea.isPresent()) {
            throw new HSException("WORK_AREA_ALREADY_EXISTS");
        }
        workAreaDTO.setStatus(Status.ACTIVE);
        workAreaDTO.setCreatedAt(LocalDateTime.now());
        workAreaDTO.setUpdatedAt(LocalDateTime.now());
        return workAreaRepository.save(workAreaDTO.toEntity()).getId();
    }

    @Override
    public void updateWorkArea(WorkAreaDTO workAreaDTO) throws HSException {
        WorkArea existingWorkArea = workAreaRepository.findById(workAreaDTO.getId())
                .orElseThrow(() -> new HSException("WORK_AREA_NOT_FOUND"));
        if (!workAreaDTO.getName().equalsIgnoreCase(existingWorkArea.getName()) ||
                !workAreaDTO.getDepartmentId().equals(existingWorkArea.getDepartmentId())) {
            Optional<WorkArea> opt = workAreaRepository.findByNameIgnoreCaseAndDepartmentId(
                    workAreaDTO.getName(), workAreaDTO.getDepartmentId());
            if (opt.isPresent()) {
                throw new HSException("WORK_AREA_ALREADY_EXISTS");
            } else {
                existingWorkArea.setName(workAreaDTO.getName());
                existingWorkArea.setDepartmentId(workAreaDTO.getDepartmentId());
                existingWorkArea.setUpdatedAt(LocalDateTime.now());
                workAreaRepository.save(existingWorkArea);
            }
        }
    }

    @Override
    public void deleteWorkArea(Long id) throws HSException {
        workAreaRepository.deleteById(id);
    }

    @Override
    public WorkAreaDTO getWorkAreaById(Long id) throws HSException {
        return workAreaRepository.findById(id)
                .map(WorkArea::toDTO)
                .orElseThrow(() -> new HSException("WORK_AREA_NOT_FOUND"));
    }

    @Override
    public List<WorkAreaDTO> getAllWorkArea() throws HSException {
        List<WorkAreaDTO> areas = ((List<WorkArea>) workAreaRepository.findAll())
                .stream()
                .map(WorkArea::toDTO)
                .toList();
        populateDepartmentNames(areas);
        return areas;

    }

    @Override
    public List<WorkAreaDTO> getAllActiveWorkArea() throws HSException {
        List<WorkAreaDTO> areas = ((List<WorkArea>) workAreaRepository.findByStatus(Status.ACTIVE))
                .stream()
                .map(WorkArea::toDTO)
                .toList();
        populateDepartmentNames(areas);
        return areas;
    }

    @Override
    public void activateWorkArea(Long id) throws HSException {
        WorkArea workArea = workAreaRepository.findById(id)
                .orElseThrow(() -> new HSException("WORK_AREA_NOT_FOUND"));
        if (workArea.getStatus() == Status.ACTIVE) {
            throw new HSException("WORK_AREA_ALREADY_ACTIVE");
        }
        workArea.setStatus(Status.ACTIVE);
        workArea.setUpdatedAt(LocalDateTime.now());
        workAreaRepository.save(workArea);
    }

    @Override
    public void deactivateWorkArea(Long id) throws HSException {
        WorkArea workArea = workAreaRepository.findById(id)
                .orElseThrow(() -> new HSException("WORK_AREA_NOT_FOUND"));
        if (workArea.getStatus() == Status.INACTIVE) {
            throw new HSException("WORK_AREA_ALREADY_INACTIVE");
        }
        workArea.setStatus(Status.INACTIVE);
        workArea.setUpdatedAt(LocalDateTime.now());
        workAreaRepository.save(workArea);
    }

    private void populateDepartmentNames(List<WorkAreaDTO> areas) {
        List<Long> deptIds = areas.stream()
                .map(WorkAreaDTO::getDepartmentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<DepartmentNames> deptNames = hrmsClient.getDepartmentNames(deptIds);
        Map<Long, String> deptIdToName = deptNames.stream()
                .collect(Collectors.toMap(DepartmentNames::getId, DepartmentNames::getName));

        areas.forEach(area -> {
            if (area.getDepartmentId() != null) {
                area.setDepartmentName(deptIdToName.get(area.getDepartmentId()));
            }
        });
    }

}
