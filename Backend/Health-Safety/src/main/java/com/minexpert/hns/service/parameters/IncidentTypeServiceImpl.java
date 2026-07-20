package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.IncidentTypeDTO;
import com.minexpert.hns.dto.response.CategorySeverityCount;
import com.minexpert.hns.dto.response.IncidentTypeDetails;
import com.minexpert.hns.entity.parameters.IncidentCategory;
import com.minexpert.hns.entity.parameters.IncidentType;
import com.minexpert.hns.entity.parameters.SeverityLevel;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.IncidentTypeRepository;

@Service
@Transactional
public class IncidentTypeServiceImpl implements IncidentTypeService {

    @Autowired
    private IncidentTypeRepository incidentTypeRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    /**
     * Mine effective pour une opération sur une entité EXISTANTE. Le paramètre
     * {@code companyId} prime s'il désigne une mine précise (utilisateur cloisonné) ;
     * sinon (admin « Toutes les Mines » en vue consolidée) on DÉRIVE la mine de l'entité.
     */
    private Long resolveOwningCompany(Long companyId, IncidentType existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("INCIDENT_TYPE_NOT_FOUND");
        }
        return effective;
    }

    private IncidentType loadIncidentType(Long companyId, Long id) throws HSException {
        return incidentTypeRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INCIDENT_TYPE_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTypesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsSeverity", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategory", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategorySeverity", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addIncidentType(Long companyId, IncidentTypeDTO incidentTypeDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<IncidentType> optional = incidentTypeRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                incidentTypeDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("INCIDENT_TYPE_ALREADY_EXISTS");
        }
        incidentTypeDTO.setCompanyId(companyId);
        incidentTypeDTO.setStatus(Status.ACTIVE);
        incidentTypeDTO.setCreatedAt(LocalDateTime.now());
        incidentTypeDTO.setUpdatedAt(LocalDateTime.now());
        IncidentType savedIncidentType = incidentTypeRepository.save(incidentTypeDTO.toEntity());

        return savedIncidentType.getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTypeById", key = "#companyId != null && #incidentTypeDTO.id != null ? (#companyId + '-' + #incidentTypeDTO.id) : 'ALL-' + #incidentTypeDTO.id", condition = "#incidentTypeDTO.id != null"),
            @CacheEvict(cacheNames = "incidentTypesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsSeverity", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategory", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategorySeverity", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateIncidentType(Long companyId, IncidentTypeDTO incidentTypeDTO) throws HSException {
        IncidentType existingIncidentType = loadIncidentType(companyId, incidentTypeDTO.getId());
        companyId = resolveOwningCompany(companyId, existingIncidentType);
        if (!existingIncidentType.getName().equalsIgnoreCase(incidentTypeDTO.getName())) {
            Optional<IncidentType> optional = incidentTypeRepository
                    .findByCompanyIdAndNameIgnoreCase(companyId, incidentTypeDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("INCIDENT_TYPE_ALREADY_EXISTS");
            }
        }
        existingIncidentType.setName(incidentTypeDTO.getName());
        existingIncidentType.setDescription(incidentTypeDTO.getDescription());
        existingIncidentType.setIncidentCategory(new IncidentCategory(incidentTypeDTO.getIncidentCategoryId()));
        existingIncidentType.setSeverityLevel(new SeverityLevel(incidentTypeDTO.getSeverityLevelId()));
        existingIncidentType.setCompanyId(companyId);
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTypeById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTypesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsSeverity", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategory", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypeCountsCategorySeverity", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteIncidentType(Long companyId, Long id) throws HSException {
        IncidentType incidentType = loadIncidentType(companyId, id);
        incidentTypeRepository.delete(incidentType);
    }

    @Override
    @Cacheable(cacheNames = "incidentTypeById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public IncidentTypeDTO getIncidentTypeById(Long companyId, Long id) throws HSException {
        return loadIncidentType(companyId, id).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTypeById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTypesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateIncidentType(Long companyId, Long id) throws HSException {
        IncidentType existingIncidentType = loadIncidentType(companyId, id);
        existingIncidentType.setStatus(Status.ACTIVE);
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "incidentTypeById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "incidentTypesAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateIncidentType(Long companyId, Long id) throws HSException {
        IncidentType existingIncidentType = loadIncidentType(companyId, id);
        existingIncidentType.setStatus(Status.INACTIVE);
        existingIncidentType.setUpdatedAt(LocalDateTime.now());
        incidentTypeRepository.save(existingIncidentType);
    }

    @Override
    public List<IncidentTypeDetails> getAllIncidentTypes(Long companyId) throws HSException {
        return incidentTypeRepository.findAllWithName(companyId);
    }

    @Override
    @Cacheable(cacheNames = "incidentTypesActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<IncidentTypeDetails> getAllActiveIncidentTypes(Long companyId) throws HSException {
        return incidentTypeRepository.findAllByStatus(companyId, Status.ACTIVE);
    }

    @Override
    @Cacheable(cacheNames = "incidentTypeCountsSeverity", key = "#companyId != null ? #companyId : 'ALL'")
    public List<CategorySeverityCount> countIncidentTypesBySeverityLevel(Long companyId) throws HSException {
        return incidentTypeRepository.countTypesByLevel(companyId);
    }

    @Override
    @Cacheable(cacheNames = "incidentTypeCountsCategory", key = "#companyId != null ? #companyId : 'ALL'")
    public List<CategorySeverityCount> countIncidentTypesByCategory(Long companyId) throws HSException {
        return incidentTypeRepository.countTypesByCategory(companyId);
    }

    @Override
    @Cacheable(cacheNames = "incidentTypeCountsCategorySeverity", key = "#companyId != null ? #companyId : 'ALL'")
    public List<CategorySeverityCount> countByCategoryAndSeverityLevel(Long companyId) throws HSException {
        return incidentTypeRepository.countByCategoryAndSeverityLevel(companyId);
    }

}
