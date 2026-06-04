package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.IncidentCategoryRepository;

@Service
@Transactional
public class IncidentCategoryServiceImpl implements IncidentCategoryService {

    @Autowired
    private IncidentCategoryRepository incidentCategoryRepository;

    @Override
    public Long addIncidentCategory(IncidentCategoryDTO incidentCategoryDTO) throws HSException {
        Optional<IncidentCategory> optional = incidentCategoryRepository
                .findByNameIgnoreCase(incidentCategoryDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("INCIDENT_CATEGORY_ALREADY_EXISTS");
        }
        incidentCategoryDTO.setStatus(Status.ACTIVE);
        incidentCategoryDTO.setCreatedAt(LocalDateTime.now());
        incidentCategoryDTO.setUpdatedAt(LocalDateTime.now());
        IncidentCategory savedCategory = incidentCategoryRepository.save(incidentCategoryDTO.toEntity());

        return savedCategory.getId();
    }

    @Override
    public void updateIncidentCategory(IncidentCategoryDTO incidentCategoryDTO) throws HSException {
        IncidentCategory existingCategory = incidentCategoryRepository.findById(incidentCategoryDTO.getId())
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (!existingCategory.getName().equalsIgnoreCase(incidentCategoryDTO.getName())) {
            Optional<IncidentCategory> optional = incidentCategoryRepository
                    .findByNameIgnoreCase(incidentCategoryDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("INCIDENT_CATEGORY_ALREADY_EXISTS");
            }
        }
        existingCategory.setName(incidentCategoryDTO.getName());
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);

    }

    @Override
    public void deleteIncidentCategory(Long id) {

    }

    @Override
    public IncidentCategoryDTO getIncidentCategoryById(Long id) throws HSException {
        return incidentCategoryRepository.findById(id).map(IncidentCategory::toDTO)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
    }

    @Override
    public void activateIncidentCategory(Long id) throws HSException {
        IncidentCategory existingCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        existingCategory.setStatus(Status.ACTIVE);
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);
    }

    @Override
    public void deactivateIncidentCategory(Long id) throws HSException {
        IncidentCategory existingCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        existingCategory.setStatus(Status.INACTIVE);
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);
    }

    @Override
    public List<IncidentCategoryDTO> getAllIncidentCategories() throws HSException {
        List<IncidentCategory> incidentCategories = (List<IncidentCategory>) incidentCategoryRepository.findAll();
        return incidentCategories.stream().map(IncidentCategory::toDTO).toList();
    }

    @Override
    public List<IncidentCategoryResponse> getAllActiveIncidentCategories() throws HSException {
        return incidentCategoryRepository.findAllActiveCategories();
    }
}
