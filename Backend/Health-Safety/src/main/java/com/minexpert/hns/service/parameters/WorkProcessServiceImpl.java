package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.WorkProcessDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.WorkProcessRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class WorkProcessServiceImpl implements WorkProcessService {
    private final WorkProcessRepository workProcessRepository;
    private final HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private WorkProcess loadWorkProcess(Long companyId, Long id) throws HSException {
        return workProcessRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("WORK_PROCESS_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addWorkProcess(Long companyId, WorkProcessDTO workProcessDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<WorkProcess> existingWorkProcess = workProcessRepository
                .findByCompanyIdAndDepartmentIdAndNameIgnoreCase(companyId, workProcessDTO.getDepartmentId(),
                        workProcessDTO.getName());
        if (existingWorkProcess.isPresent()) {
            throw new HSException("WORK_PROCESS_ALREADY_EXISTS");
        }
        workProcessDTO.setCompanyId(companyId);
        workProcessDTO.setStatus(Status.ACTIVE);
        workProcessDTO.setCreatedAt(LocalDateTime.now());
        workProcessDTO.setUpdatedAt(LocalDateTime.now());
        return workProcessRepository.save(workProcessDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workProcessById", key = "#companyId != null && #workProcessDTO.id != null ? (#companyId + '-' + #workProcessDTO.id) : 'ALL-' + #workProcessDTO.id", condition = "#workProcessDTO.id != null"),
            @CacheEvict(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateWorkProcess(Long companyId, WorkProcessDTO workProcessDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkProcess existingWorkProcess = loadWorkProcess(companyId, workProcessDTO.getId());
        if (!workProcessDTO.getName().equalsIgnoreCase(existingWorkProcess.getName()) ||
                !Objects.equals(workProcessDTO.getDepartmentId(), existingWorkProcess.getDepartmentId())) {
            Optional<WorkProcess> opt = workProcessRepository
                    .findByCompanyIdAndDepartmentIdAndNameIgnoreCase(companyId, workProcessDTO.getDepartmentId(),
                            workProcessDTO.getName());
            if (opt.isPresent() && !opt.get().getId().equals(existingWorkProcess.getId())) {
                throw new HSException("WORK_PROCESS_ALREADY_EXISTS");
            }
        }
        existingWorkProcess.setName(workProcessDTO.getName());
        existingWorkProcess.setDepartmentId(workProcessDTO.getDepartmentId());
        existingWorkProcess.setCompanyId(companyId);
        existingWorkProcess.setUpdatedAt(LocalDateTime.now());
        workProcessRepository.save(existingWorkProcess);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workProcessById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteWorkProcess(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkProcess workProcess = loadWorkProcess(companyId, id);
        workProcessRepository.delete(workProcess);
    }

    @Override
    @Cacheable(cacheNames = "workProcessById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public WorkProcessDTO getWorkProcessById(Long companyId, Long id) throws HSException {
        return loadWorkProcess(companyId, id).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WorkProcessDTO> getAllWorkProcess(Long companyId) throws HSException {
        List<WorkProcessDTO> processs = workProcessRepository.findAllWithCompany(companyId)
                .stream()
                .map(WorkProcess::toDTO)
                .toList();
        populateDepartmentNames(processs);
        return processs;

    }

    @Override
    @Cacheable(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WorkProcessDTO> getAllActiveWorkProcess(Long companyId) throws HSException {
        List<WorkProcessDTO> processs = workProcessRepository.findAllByStatus(companyId, Status.ACTIVE)
                .stream()
                .map(WorkProcess::toDTO)
                .toList();
        populateDepartmentNames(processs);
        return processs;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workProcessById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateWorkProcess(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkProcess workProcess = loadWorkProcess(companyId, id);
        if (workProcess.getStatus() == Status.ACTIVE) {
            throw new HSException("WORK_PROCESS_ALREADY_ACTIVE");
        }
        workProcess.setStatus(Status.ACTIVE);
        workProcess.setUpdatedAt(LocalDateTime.now());
        workProcessRepository.save(workProcess);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workProcessById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workProcessesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workProcessesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateWorkProcess(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkProcess workProcess = loadWorkProcess(companyId, id);
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

        if (deptIds.isEmpty()) {
            return;
        }

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
