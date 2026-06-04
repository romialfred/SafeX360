package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.IncidentTypeRepository;

@Service
@Transactional
public class IncidentTypeServiceImpl implements IncidentTypeService {

    @Autowired
    private IncidentTypeRepository incidentTypeRepository;

    @Override
    public Long addIncidentType(IncidentTypeDTO incidentTypeDTO) throws HSException {
        Optional<IncidentType> optional = incidentTypeRepository.findByNameIgnoreCase(incidentTypeDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("INCIDENT_TYPE_ALREADY_EXISTS");
        }
        System.out.println("IncidentTypeDTO: " + incidentTypeDTO);
        incidentTypeDTO.setStatus(Status.ACTIVE);
        incidentTypeDTO.setCreatedAt(LocalDateTime.now());
        incidentTypeDTO.setUpdatedAt(LocalDateTime.now());
        IncidentType savedIncidentType = incidentTypeRepository.save(incidentTypeDTO.toEntity());

        return savedIncidentType.getId();
    }

    @Override
    public void updateIncidentType(IncidentTypeDTO incidentTypeDTO) throws HSException {
        IncidentType existingIncidentType = incidentTypeRepository.findById(incidentTypeDTO.getId())
                .orElseThrow(() -> new HSException("INCIDENT_TYPE_NOT_FOUND"));
        if (!existingIncidentType.getName().equalsIgnoreCase(incidentTypeDTO.getName())) {
            Optional<IncidentType> optional = incidentTypeRepository.findByNameIgnoreCase(incidentTypeDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("INCIDENT_TYPE_ALREADY_EXISTS");
            }
        }
        existingIncidentType.setName(incidentTypeDTO.getName());
        existingIncidentType.setDescription(incidentTypeDTO.getDescription());
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    public void deleteIncidentType(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteIncidentType'");
    }

    @Override
    public IncidentTypeDTO getIncidentTypeById(Long id) throws HSException {
        return incidentTypeRepository.findById(id).map(IncidentType::toDTO)
                .orElseThrow(() -> new HSException("INCIDENT_TYPE_NOT_FOUND"));
    }

    @Override
    public void activateIncidentType(Long id) throws HSException {
        IncidentType existingIncidentType = incidentTypeRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TYPE_NOT_FOUND"));
        existingIncidentType.setStatus(Status.ACTIVE);
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    public void deactivateIncidentType(Long id) throws HSException {
        IncidentType existingIncidentType = incidentTypeRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_TYPE_NOT_FOUND"));
        existingIncidentType.setStatus(Status.INACTIVE);
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    public List<IncidentTypeDetails> getAllIncidentTypes() throws HSException {
        return incidentTypeRepository.findAllWithName();
    }

    @Override
    public List<IncidentTypeDetails> getAllActiveIncidentTypes() throws HSException {
        return incidentTypeRepository.findAllActiveTypes();
    }

    @Override
    public List<CategorySeverityCount> countIncidentTypesBySeverityLevel() throws HSException {
        return incidentTypeRepository.countTypesByLevel();
    }

    @Override
    public List<CategorySeverityCount> countIncidentTypesByCategory() throws HSException {
        return incidentTypeRepository.countTypesByCategory();
    }

    @Override
    public List<CategorySeverityCount> countByCategoryAndSeverityLevel() throws HSException {
        return incidentTypeRepository.countByCategoryAndSeverityLevel();
    }

}
