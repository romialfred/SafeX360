package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.parameters.IncidentCategoryDTO;
import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.IncidentCategoryRepository;

@Service
public class IncidentCategoryServiceImpl implements IncidentCategoryService {

    @Autowired
    private IncidentCategoryRepository incidentCategoryRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addIncidentCategory(Long companyId, IncidentCategoryDTO incidentCategoryDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<IncidentCategory> optional = incidentCategoryRepository
                .findByCompanyIdAndNameIgnoreCase(companyId, incidentCategoryDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("INCIDENT_CATEGORY_ALREADY_EXISTS");
        }
        incidentCategoryDTO.setStatus(Status.ACTIVE);
        incidentCategoryDTO.setCompanyId(companyId);
        incidentCategoryDTO.setCreatedAt(LocalDateTime.now());
        incidentCategoryDTO.setUpdatedAt(LocalDateTime.now());
        IncidentCategory savedCategory = incidentCategoryRepository.save(incidentCategoryDTO.toEntity());

        return savedCategory.getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentCategoryById", key = "#companyId != null ? (#companyId + '-' + #incidentCategoryDTO.id) : 'ALL-' + #incidentCategoryDTO.id", condition = "#incidentCategoryDTO.id != null"),
            @CacheEvict(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateIncidentCategory(Long companyId, IncidentCategoryDTO incidentCategoryDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentCategory existingCategory = incidentCategoryRepository.findById(incidentCategoryDTO.getId())
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (!companyId.equals(existingCategory.getCompanyId())) {
            throw new HSException("INCIDENT_CATEGORY_NOT_FOUND");
        }
        if (!existingCategory.getName().equalsIgnoreCase(incidentCategoryDTO.getName())) {
            Optional<IncidentCategory> optional = incidentCategoryRepository
                    .findByCompanyIdAndNameIgnoreCase(companyId, incidentCategoryDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("INCIDENT_CATEGORY_ALREADY_EXISTS");
            }
        }
        existingCategory.setName(incidentCategoryDTO.getName());
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentCategoryById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteIncidentCategory(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentCategory incidentCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (!companyId.equals(incidentCategory.getCompanyId())) {
            throw new HSException("INCIDENT_CATEGORY_NOT_FOUND");
        }
        incidentCategoryRepository.delete(incidentCategory);

    }

    @Override
    @Cacheable(cacheNames = "incidentCategoryById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentCategoryDTO getIncidentCategoryById(Long companyId, Long id) throws HSException {
        IncidentCategory incidentCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (companyId != null && !companyId.equals(incidentCategory.getCompanyId())) {
            throw new HSException("INCIDENT_CATEGORY_NOT_FOUND");
        }
        return incidentCategory.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentCategoryById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateIncidentCategory(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentCategory existingCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (!companyId.equals(existingCategory.getCompanyId())) {
            throw new HSException("INCIDENT_CATEGORY_NOT_FOUND");
        }
        existingCategory.setStatus(Status.ACTIVE);
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentCategoryById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateIncidentCategory(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        IncidentCategory existingCategory = incidentCategoryRepository.findById(id)
                .orElseThrow(() -> new HSException("INCIDENT_CATEGORY_NOT_FOUND"));
        if (!companyId.equals(existingCategory.getCompanyId())) {
            throw new HSException("INCIDENT_CATEGORY_NOT_FOUND");
        }
        existingCategory.setStatus(Status.INACTIVE);
        existingCategory.setUpdatedAt(LocalDateTime.now());
        incidentCategoryRepository.save(existingCategory);
    }

    @Override
    @Cacheable(cacheNames = "incidentCategoriesAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentCategoryDTO> getAllIncidentCategories(Long companyId) throws HSException {
        List<IncidentCategory> incidentCategories = incidentCategoryRepository.findAllByCompanyId(companyId);
        return incidentCategories.stream().map(IncidentCategory::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = "incidentCategoriesActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentCategoryResponse> getAllActiveIncidentCategories(Long companyId) throws HSException {
        return incidentCategoryRepository.findAllByStatus(companyId, Status.ACTIVE);
    }
}
