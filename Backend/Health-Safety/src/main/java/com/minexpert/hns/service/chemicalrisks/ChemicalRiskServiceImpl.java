package com.minexpert.hns.service.chemicalrisks;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.ChemicalRiskCacheNames;
import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskDTO;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ChemicalRiskServiceImpl implements ChemicalRiskService {
    private final ChemicalRiskRepository chemicalRiskRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, key = "#result.id")
    })
    public ChemicalRiskDTO create(ChemicalRiskDTO dto) throws HSException {
        ChemicalRisk risk = dto.toEntity();
        ChemicalRisk saved = chemicalRiskRepository.save(risk);
        return saved.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, key = "#dto.id"),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true)
    })
    public ChemicalRiskDTO update(ChemicalRiskDTO dto) throws HSException {
        ChemicalRisk existing = chemicalRiskRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setDepartmentId(dto.getDepartmentId());
        existing.setWorkProcess(new WorkProcess(dto.getWorkProcessId()));
        existing.setHazardSource(dto.getHazardSource());
        existing.setPotentialConsequences(dto.getPotentialConsequences());
        existing.setOwnerId(dto.getOwnerId());
        existing.setReviewDate(dto.getReviewDate());
        existing.setStatus(dto.getStatus());
        existing.setChemicalName(dto.getChemicalName());
        existing.setCasNumber(dto.getCasNumber());
        existing.setClassification(dto.getClassification());
        existing.setMethodOfUse(dto.getMethodOfUse());
        existing.setActivityType(dto.getActivityType());
        existing.setHazardCategory(dto.getHazardCategory());
        existing.setPersonsExposed(dto.getPersonsExposed());
        existing.setExposureCount(dto.getExposureCount());
        existing.setLegalRequirements(dto.getLegalRequirements());
        existing.setNextReviewDate(dto.getNextReviewDate());
        ChemicalRisk updated = chemicalRiskRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, key = "#id"),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true)
    })
    public ChemicalRiskDTO updateStatus(Long id, String status) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        risk.setStatus(status);
        return risk.toDTO();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, key = "#id")
    public ChemicalRiskDTO getById(Long id) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        return risk.toDTO();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL)
    public List<ChemicalRiskDTO> getAll() throws HSException {
        return chemicalRiskRepository.findAll()
                .stream()
                .map(ChemicalRisk::toDTO)
                .toList();
    }
}
