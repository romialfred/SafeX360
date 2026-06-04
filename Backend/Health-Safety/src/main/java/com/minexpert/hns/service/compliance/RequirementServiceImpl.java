package com.minexpert.hns.service.compliance;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.compliance.RequirementDTO;
import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.RequirementRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class RequirementServiceImpl implements RequirementService {
    private final RequirementRepository requirementRepository;

    @Override
    public Long createRequirement(RequirementDTO requirementDTO) throws HSException {
        Optional<Requirement> optional = requirementRepository.findByTitleIgnoreCase(requirementDTO.getTitle());
        if (optional.isPresent()) {
            throw new HSException("REQUIREMENT_ALREADY_EXISTS");
        }
        requirementDTO.setStatus(Status.ACTIVE);
        requirementDTO.setCreatedAt(LocalDateTime.now());
        requirementDTO.setUpdatedAt(LocalDateTime.now());
        return requirementRepository.save(requirementDTO.toEntity()).getId();

    }

    @Override
    public RequirementDTO getRequirementById(Long id) throws HSException {
        return requirementRepository.findById(id).orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND")).toDTO();
    }

    @Override
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
        requirementRepository.save(requirement);

    }

    @Override
    public void activateRequirement(Long id) throws HSException {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND"));
        requirement.setStatus(Status.ACTIVE);
        requirementRepository.save(requirement);
    }

    @Override
    public void deactivateRequirement(Long id) throws HSException {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new HSException("REQUIREMENT_NOT_FOUND"));
        requirement.setStatus(Status.INACTIVE);
        requirementRepository.save(requirement);
    }

    @Override
    public List<RequirementDTO> getAllRequirements() throws HSException {
        return ((List<Requirement>) requirementRepository.findAll()).stream().map(Requirement::toDTO).toList();
    }

    @Override
    public List<RequirementDTO> getAllActiveRequirements() {
        return ((List<Requirement>) requirementRepository.findByStatus(Status.ACTIVE)).stream().map(Requirement::toDTO)
                .toList();
    }
}
