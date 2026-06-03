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

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.parameters.WorkAreaDTO;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.WorkAreaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkAreaServiceImpl implements WorkAreaService {

    private final WorkAreaRepository workAreaRepository;
    private final HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private WorkArea loadWorkArea(Long companyId, Long id) throws HSException {
        return workAreaRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("WORK_AREA_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addWorkArea(Long companyId, WorkAreaDTO workAreaDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<WorkArea> existingWorkArea = workAreaRepository
                .findByCompanyIdAndDepartmentIdAndNameIgnoreCase(companyId, workAreaDTO.getDepartmentId(),
                        workAreaDTO.getName());
        if (existingWorkArea.isPresent()) {
            throw new HSException("WORK_AREA_ALREADY_EXISTS");
        }
        workAreaDTO.setCompanyId(companyId);
        workAreaDTO.setStatus(Status.ACTIVE);
        workAreaDTO.setCreatedAt(LocalDateTime.now());
        workAreaDTO.setUpdatedAt(LocalDateTime.now());
        return workAreaRepository.save(workAreaDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workAreaById", key = "#companyId != null && #workAreaDTO.id != null ? (#companyId + '-' + #workAreaDTO.id) : 'ALL-' + #workAreaDTO.id", condition = "#workAreaDTO.id != null"),
            @CacheEvict(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateWorkArea(Long companyId, WorkAreaDTO workAreaDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkArea existingWorkArea = loadWorkArea(companyId, workAreaDTO.getId());
        if (!workAreaDTO.getName().equalsIgnoreCase(existingWorkArea.getName()) ||
                !Objects.equals(workAreaDTO.getDepartmentId(), existingWorkArea.getDepartmentId())) {
            Optional<WorkArea> opt = workAreaRepository
                    .findByCompanyIdAndDepartmentIdAndNameIgnoreCase(companyId, workAreaDTO.getDepartmentId(),
                            workAreaDTO.getName());
            if (opt.isPresent() && !opt.get().getId().equals(existingWorkArea.getId())) {
                throw new HSException("WORK_AREA_ALREADY_EXISTS");
            }
        }
        existingWorkArea.setName(workAreaDTO.getName());
        existingWorkArea.setDepartmentId(workAreaDTO.getDepartmentId());
        existingWorkArea.setCompanyId(companyId);
        existingWorkArea.setUpdatedAt(LocalDateTime.now());
        workAreaRepository.save(existingWorkArea);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteWorkArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkArea workArea = loadWorkArea(companyId, id);
        workAreaRepository.delete(workArea);
    }

    @Override
    @Cacheable(cacheNames = "workAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public WorkAreaDTO getWorkAreaById(Long companyId, Long id) throws HSException {
        return loadWorkArea(companyId, id).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WorkAreaDTO> getAllWorkArea(Long companyId) throws HSException {
        List<WorkAreaDTO> areas = workAreaRepository.findAllWithCompany(companyId)
                .stream()
                .map(WorkArea::toDTO)
                .toList();
        populateDepartmentNames(areas);
        return areas;

    }

    @Override
    @Cacheable(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WorkAreaDTO> getAllActiveWorkArea(Long companyId) throws HSException {
        List<WorkAreaDTO> areas = workAreaRepository.findAllByStatus(companyId, Status.ACTIVE)
                .stream()
                .map(WorkArea::toDTO)
                .toList();
        populateDepartmentNames(areas);
        return areas;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateWorkArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkArea workArea = loadWorkArea(companyId, id);
        if (workArea.getStatus() == Status.ACTIVE) {
            throw new HSException("WORK_AREA_ALREADY_ACTIVE");
        }
        workArea.setStatus(Status.ACTIVE);
        workArea.setUpdatedAt(LocalDateTime.now());
        workAreaRepository.save(workArea);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "workAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "workAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "workAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateWorkArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WorkArea workArea = loadWorkArea(companyId, id);
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

        if (deptIds.isEmpty()) {
            return;
        }

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
