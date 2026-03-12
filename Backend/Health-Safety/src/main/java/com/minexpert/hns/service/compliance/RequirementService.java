package com.minexpert.hns.service.compliance;

import java.util.List;

import com.minexpert.hns.dto.compliance.RequirementDTO;
import com.minexpert.hns.exception.HSException;

public interface RequirementService {
    public Long createRequirement(RequirementDTO requirementDTO) throws HSException;

    public RequirementDTO getRequirementById(Long id) throws HSException;

    public void updateRequirement(RequirementDTO requirementDTO) throws HSException;

    public void activateRequirement(Long id) throws HSException;

    public void deactivateRequirement(Long id) throws HSException;

    public List<RequirementDTO> getAllRequirements() throws HSException;

    public List<RequirementDTO> getAllActiveRequirements();
}
