package com.minexpert.hns.service.compliance;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.compliance.RequirementDTO;
import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.RequirementRepository;
import com.minexpert.hns.config.ComplianceCacheNames;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class RequirementServiceImpl implements RequirementService {
    private final RequirementRepository requirementRepository;

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.REQUIREMENT_BY_ID,
            ComplianceCacheNames.REQUIREMENTS_ALL,
            ComplianceCacheNames.REQUIREMENTS_ACTIVE,
            ComplianceCacheNames.REQUIREMENTS_BY_POSITION,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS
    }, allEntries = true)
    public Long createRequirement(RequirementDTO requirementDTO) throws HSException {
        Optional<Requirement> optional = requirementRepository.findByTitleIgnoreCase(requirementDTO.getTitle());
        if (optional.isPresent()) {
            throw new HSException("REQUIREMENT_ALREADY_EXISTS");
        }
        requirementDTO.setStatus(Status.ACTIVE);
        requirementDTO.setCreatedAt(LocalDateTime.now());
        requirementDTO.setUpdatedAt(LocalDateTime.now());
        Requirement saved = requirementRepository.save(requirementDTO.toEntity());
        // LOT 49 : code de référence auto si absent (EXG-001, EXG-002, ...)
        if (saved.getReferenceCode() == null || saved.getReferenceCode().isBlank()) {
            saved.setReferenceCode(String.format("EXG-%03d", saved.getId()));
            requirementRepository.save(saved);
        }
        return saved.getId();
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.REQUIREMENT_BY_ID, key = "#id")
    public RequirementDTO getRequirementById(Long id) throws HSException {
        return requirementRepository.findById(id).orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND")).toDTO();
    }

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.REQUIREMENT_BY_ID,
            ComplianceCacheNames.REQUIREMENTS_ALL,
            ComplianceCacheNames.REQUIREMENTS_ACTIVE,
            ComplianceCacheNames.REQUIREMENTS_BY_POSITION,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS
    }, allEntries = true)
    public void updateRequirement(RequirementDTO requirementDTO) throws HSException {
        Requirement requirement = requirementRepository.findById(requirementDTO.getId())
                .orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND"));
        if (!requirement.getTitle().equalsIgnoreCase(requirementDTO.getTitle())) {
            Optional<Requirement> opt1 = requirementRepository.findByTitleIgnoreCase(requirementDTO.getTitle());
            if (opt1.isPresent()) {
                throw new HSException("REQUIREMENT_NAME_ALREADY_EXISTS");
            }
        }
        requirement.setTitle(requirementDTO.getTitle());
        requirement.setCategory(requirementDTO.getCategory());
        requirement.setDescription(requirementDTO.getDescription());
        requirement.setDocType(requirementDTO.getDocType());
        requirement.setRenewalFrequency(requirementDTO.getRenewalFrequency());
        requirement.setLegalSource(requirementDTO.getLegalSource());
        requirement.setAuthority(requirementDTO.getAuthority());
        requirement.setCriticality(requirementDTO.getCriticality());
        if (requirementDTO.getReferenceCode() != null && !requirementDTO.getReferenceCode().isBlank()) {
            requirement.setReferenceCode(requirementDTO.getReferenceCode());
        }
        requirement.setStatus(requirementDTO.getStatus());
        requirement.setUpdatedAt(LocalDateTime.now());
        requirementRepository.save(requirement);

    }

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.REQUIREMENT_BY_ID,
            ComplianceCacheNames.REQUIREMENTS_ALL,
            ComplianceCacheNames.REQUIREMENTS_ACTIVE,
            ComplianceCacheNames.REQUIREMENTS_BY_POSITION,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS
    }, allEntries = true)
    public void activateRequirement(Long id) throws HSException {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND"));
        requirement.setStatus(Status.ACTIVE);
        requirementRepository.save(requirement);
    }

    @Override
    @CacheEvict(cacheNames = {
            ComplianceCacheNames.REQUIREMENT_BY_ID,
            ComplianceCacheNames.REQUIREMENTS_ALL,
            ComplianceCacheNames.REQUIREMENTS_ACTIVE,
            ComplianceCacheNames.REQUIREMENTS_BY_POSITION,
            ComplianceCacheNames.REQUIREMENTS_BY_EMPLOYEE,
            ComplianceCacheNames.DASHBOARD_ACTION_ITEMS,
            ComplianceCacheNames.DASHBOARD_DEPARTMENT_SUMMARY,
            ComplianceCacheNames.DASHBOARD_OVERALL_STATUS
    }, allEntries = true)
    public void deactivateRequirement(Long id) throws HSException {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND"));
        requirement.setStatus(Status.INACTIVE);
        requirementRepository.save(requirement);
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.REQUIREMENTS_ALL)
    public List<RequirementDTO> getAllRequirements() throws HSException {
        return ((List<Requirement>) requirementRepository.findAll()).stream().map(Requirement::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = ComplianceCacheNames.REQUIREMENTS_ACTIVE)
    public List<RequirementDTO> getAllActiveRequirements() {
        return ((List<Requirement>) requirementRepository.findByStatus(Status.ACTIVE)).stream().map(Requirement::toDTO)
                .toList();
    }
}
