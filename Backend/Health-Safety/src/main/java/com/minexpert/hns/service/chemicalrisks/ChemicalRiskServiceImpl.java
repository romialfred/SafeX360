package com.minexpert.hns.service.chemicalrisks;

import java.util.List;
import java.util.Set;

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
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, allEntries = true)
    })
    public ChemicalRiskDTO create(ChemicalRiskDTO dto) throws HSException {
        // Un risque chimique SANS mine (companyId absent) devient une entite
        // orpheline, invisible des qu'une mine est selectionnee. On refuse la
        // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
        // injecte dans le DTO par le controller depuis la mine active du header.
        if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        requireWorkProcess(dto.getWorkProcessId());
        ChemicalRisk risk = dto.toEntity();
        ChemicalRisk saved = chemicalRiskRepository.save(risk);
        return saved.toDTO();
    }

    /**
     * work_process_id est NOT NULL en base : un risque chimique sans processus
     * de travail declenchait un 500 brut (« unsaved transient instance » /
     * violation de contrainte) a l'enregistrement. On leve ici une erreur
     * metier explicite, transformee en message clair cote UI.
     */
    private void requireWorkProcess(Long workProcessId) throws HSException {
        if (workProcessId == null) {
            throw new HSException("WORK_PROCESS_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true)
    })
    public ChemicalRiskDTO update(ChemicalRiskDTO dto, Long companyId) throws HSException {
        requireWorkProcess(dto.getWorkProcessId());
        ChemicalRisk existing = chemicalRiskRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
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
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true)
    })
    public ChemicalRiskDTO updateStatus(Long id, String status, Long companyId) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        assertSameCompany(companyId, risk.getCompanyId());
        assertChemicalRiskStatus(status);
        risk.setStatus(status);
        chemicalRiskRepository.save(risk);
        return risk.toDTO();
    }

    /**
     * Cloisonnement par mine : companyId fourni => l'entité doit lui appartenir.
     * companyId null = appel système / toutes mines.
     */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("CHEMICAL_RISK_NOT_FOUND");
        }
    }

    private static final Set<String> VALID_CHEMICAL_RISK_STATUSES = Set.of(
            "IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING");

    private void assertChemicalRiskStatus(String status) throws HSException {
        if (status == null || !VALID_CHEMICAL_RISK_STATUSES.contains(status.toUpperCase())) {
            throw new HSException("INVALID_CHEMICAL_RISK_STATUS");
        }
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, key = "{#id, #companyId}")
    public ChemicalRiskDTO getById(Long id, Long companyId) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        assertSameCompany(companyId, risk.getCompanyId());
        return risk.toDTO();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, key = "#companyId != null ? #companyId : 'ALL'")
    public List<ChemicalRiskDTO> getAll(Long companyId) throws HSException {
        return chemicalRiskRepository.findAllByCompany(companyId)
                .stream()
                .map(ChemicalRisk::toDTO)
                .toList();
    }
}
