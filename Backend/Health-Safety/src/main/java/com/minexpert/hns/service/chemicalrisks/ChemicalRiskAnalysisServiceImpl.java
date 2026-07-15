package com.minexpert.hns.service.chemicalrisks;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.minexpert.hns.config.ChemicalRiskCacheNames;
import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRiskAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskAnalysisRepository;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ChemicalRiskAnalysisServiceImpl implements ChemicalRiskAnalysisService {
    private final ChemicalRiskAnalysisRepository analysisRepository;
    private final ChemicalRiskRepository chemicalRiskRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ALL, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_RISK, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_ALL, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_ID, allEntries = true)
    })
    public ChemicalRiskAnalysisDTO create(ChemicalRiskAnalysisDTO dto, Long companyId) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(dto.getRiskId())
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        assertSameCompany(companyId, risk.getCompanyId());
        // Keep the latest assessment's risk level on the parent record, mirroring
        // RiskAnalysis
        risk.setRiskLevel(dto.getRiskLevel());
        chemicalRiskRepository.save(risk);
        // L'analyse hérite TOUJOURS de la mine de son risque chimique parent.
        dto.setCompanyId(risk.getCompanyId());
        ChemicalRiskAnalysis analysis = dto.toEntity(risk);
        ChemicalRiskAnalysis saved = analysisRepository.save(analysis);
        return saved.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_ID, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_RISK, allEntries = true),
            @CacheEvict(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_ALL, allEntries = true)
    })
    public ChemicalRiskAnalysisDTO update(ChemicalRiskAnalysisDTO dto, Long companyId) throws HSException {
        ChemicalRiskAnalysis existing = analysisRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("CHEMICAL_ANALYSIS_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
        existing.setGravity(dto.getGravity());
        existing.setProbability(dto.getProbability());
        existing.setSeverity(dto.getSeverity());
        existing.setCurrentControls(dto.getCurrentControls());
        existing.setAdditionalControl(dto.getAdditionalControl());
        existing.setPreventiveMeasures(dto.getPreventiveMeasures());
        existing.setImprovementsMeasures(dto.getImprovementsMeasures());
        existing.setComments(dto.getComments());
        existing.setReason(dto.getReason());
        existing.setResidualProbability(dto.getResidualProbability());
        existing.setResidualGravity(dto.getResidualGravity());
        existing.setResidualSeverity(dto.getResidualSeverity());
        existing.setResidualRiskLevel(dto.getResidualRiskLevel());
        ChemicalRiskAnalysis updated = analysisRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_RISK, key = "{#riskId, #companyId}")
    public List<ChemicalRiskAnalysisDTO> getByRiskId(Long riskId, Long companyId) throws HSException {
        return analysisRepository.findByChemicalRiskIdAndCompany(riskId, companyId)
                .stream()
                .map(ChemicalRiskAnalysis::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_ALL, key = "#companyId")
    public List<ChemicalRiskAnalysisDTO> getAll(Long companyId) throws HSException {
        return analysisRepository.findAllByCompany(companyId)
                .stream()
                .map(ChemicalRiskAnalysis::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = ChemicalRiskCacheNames.CHEMICAL_RISK_ANALYSIS_BY_ID, key = "{#id, #companyId}")
    public ChemicalRiskAnalysisDTO getById(Long id, Long companyId) throws HSException {
        ChemicalRiskAnalysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_ANALYSIS_NOT_FOUND"));
        assertSameCompany(companyId, analysis.getCompanyId());
        return analysis.toDTO();
    }

    /**
     * Cloisonnement par mine : companyId fourni => l'entité doit lui appartenir.
     * companyId null = appel système / toutes mines.
     */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("CHEMICAL_ANALYSIS_NOT_FOUND");
        }
    }
}
