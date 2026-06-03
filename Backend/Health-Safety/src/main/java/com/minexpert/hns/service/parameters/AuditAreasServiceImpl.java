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
import com.minexpert.hns.dto.parameters.AuditAreasDTO;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.entity.parameters.AuditAreas;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.AuditAreasRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditAreasServiceImpl implements AuditAreasService {

    private final AuditAreasRepository auditAreasRepository;
    private final HrmsClient hrmsClient;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addAuditArea(Long companyId, AuditAreasDTO auditAreasDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<AuditAreas> opt = auditAreasRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                auditAreasDTO.getName());
        if (opt.isPresent()) {
            throw new HSException("AUDIT_AREA_NAME_ALREADY_EXISTS");
        }
        auditAreasDTO.setStatus(Status.ACTIVE);
        auditAreasDTO.setCompanyId(companyId);
        auditAreasDTO.setCreatedAt(LocalDateTime.now());
        auditAreasDTO.setUpdatedAt(LocalDateTime.now());
        return auditAreasRepository.save(auditAreasDTO.toEntity()).getId();

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "auditAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteAuditArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (!companyId.equals(auditAreas.getCompanyId())) {
            throw new HSException("AUDIT_AREA_NOT_FOUND");
        }
        auditAreasRepository.delete(auditAreas);
    }

    @Override
    @Cacheable(cacheNames = "auditAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public AuditAreasDTO getAuditAreaById(Long companyId, Long id) throws HSException {
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (companyId != null && !companyId.equals(auditAreas.getCompanyId())) {
            throw new HSException("AUDIT_AREA_NOT_FOUND");
        }
        return auditAreas.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<AuditAreasDTO> getAllAuditAreas(Long companyId) throws HSException {
        List<AuditAreasDTO> areas = auditAreasRepository.findAllByCompanyId(companyId)
                .stream()
                .map(AuditAreas::toDTO)
                .toList();
        populateOwnerNames(areas);
        return areas;
    }

    @Override
    @Cacheable(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<AuditAreasDTO> getAllActiveAuditAreas(Long companyId) throws HSException {
        List<AuditAreasDTO> areas = auditAreasRepository.findAllByStatus(companyId, Status.ACTIVE)
                .stream()
                .map(AuditAreas::toDTO)
                .toList();
        populateOwnerNames(areas);
        return areas;
    }

    private void populateOwnerNames(List<AuditAreasDTO> areas) {
        List<Long> empIds = areas.stream()
                .map(AuditAreasDTO::getOwner)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<EmployeeNameDTO> empNames = hrmsClient.getEmployeeNameByIds(empIds);
        Map<Long, String> empIdToName = empNames.stream()
                .collect(Collectors.toMap(EmployeeNameDTO::getId, EmployeeNameDTO::getName));

        areas.forEach(area -> {
            if (area.getOwner() != null) {
                area.setOwnerName(empIdToName.get(area.getOwner()));
            }
        });
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "auditAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateAuditArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (!companyId.equals(auditAreas.getCompanyId())) {
            throw new HSException("AUDIT_AREA_NOT_FOUND");
        }
        auditAreas.setStatus(Status.ACTIVE);
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "auditAreaById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateAuditArea(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        AuditAreas auditAreas = auditAreasRepository.findById(id)
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (!companyId.equals(auditAreas.getCompanyId())) {
            throw new HSException("AUDIT_AREA_NOT_FOUND");
        }
        auditAreas.setStatus(Status.INACTIVE);
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "auditAreaById", key = "#companyId != null ? (#companyId + '-' + #auditAreasDTO.id) : 'ALL-' + #auditAreasDTO.id", condition = "#auditAreasDTO.id != null"),
            @CacheEvict(cacheNames = "auditAreasAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "auditAreasActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateAuditArea(Long companyId, AuditAreasDTO auditAreasDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        AuditAreas auditAreas = auditAreasRepository.findById(auditAreasDTO.getId())
                .orElseThrow(() -> new HSException("AUDIT_AREA_NOT_FOUND"));
        if (!companyId.equals(auditAreas.getCompanyId())) {
            throw new HSException("AUDIT_AREA_NOT_FOUND");
        }
        if (!auditAreas.getName().equalsIgnoreCase(auditAreasDTO.getName())) {
            Optional<AuditAreas> opt = auditAreasRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    auditAreasDTO.getName());
            if (opt.isPresent()) {
                throw new HSException("AUDIT_AREA_NAME_ALREADY_EXISTS");
            }
        }
        auditAreas.setName(auditAreasDTO.getName());
        auditAreas.setUpdatedAt(LocalDateTime.now());
        auditAreasRepository.save(auditAreas);
    }

}
