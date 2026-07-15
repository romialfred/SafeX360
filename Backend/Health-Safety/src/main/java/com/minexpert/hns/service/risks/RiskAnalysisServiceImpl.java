package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskAnalysisDTO;
import com.minexpert.hns.entity.risks.RiskAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.entity.risks.Risk;
import com.minexpert.hns.repository.risks.RiskAnalysisRepository;
import com.minexpert.hns.repository.risks.RiskRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class RiskAnalysisServiceImpl implements RiskAnalysisService {
        private final RiskAnalysisRepository analysisRepository;
        private final RiskRepository riskRepository;

        @Override
        @Caching(evict = {
                        // @CacheEvict(cacheNames = "riskAnalysisById", allEntries = true),
                        @CacheEvict(cacheNames = "riskAnalysisByRisk", allEntries = true),
                        @CacheEvict(cacheNames = "riskAnalysisAll", allEntries = true),
                        @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskAnalysisDTO create(RiskAnalysisDTO dto, Long companyId) throws HSException {
                Risk risk = riskRepository.findById(dto.getRiskId())
                                .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
                assertSameCompany(companyId, risk.getCompanyId());
                risk.setRiskLevel(dto.getRiskLevel());
                riskRepository.save(risk);
                // L'analyse hérite TOUJOURS de la mine de son risque parent.
                dto.setCompanyId(risk.getCompanyId());
                RiskAnalysis analysis = dto.toEntity(risk);
                RiskAnalysis saved = analysisRepository.save(analysis);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "riskAnalysisById", allEntries = true),
                        @CacheEvict(cacheNames = "riskAnalysisByRisk", allEntries = true),
                        @CacheEvict(cacheNames = "riskAnalysisAll", allEntries = true),
                        @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskAnalysisDTO update(RiskAnalysisDTO dto, Long companyId) throws HSException {
                RiskAnalysis existing = analysisRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("ANALYSIS_NOT_FOUND"));
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
                RiskAnalysis updated = analysisRepository.save(existing);
                return updated.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisByRisk", key = "{#riskId, #companyId}")
        public List<RiskAnalysisDTO> getByRiskId(Long riskId, Long companyId) throws HSException {
                return analysisRepository.findByRiskIdAndCompany(riskId, companyId)
                                .stream()
                                .map(RiskAnalysis::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisAll", key = "#companyId != null ? #companyId : 'ALL'")
        public List<RiskAnalysisDTO> getAll(Long companyId) throws HSException {
                return analysisRepository.findAllByCompany(companyId)
                                .stream()
                                .map(RiskAnalysis::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisById", key = "{#id, #companyId}")
        public RiskAnalysisDTO getById(Long id, Long companyId) throws HSException {
                RiskAnalysis analysis = analysisRepository.findById(id)
                                .orElseThrow(() -> new HSException("ANALYSIS_NOT_FOUND"));
                assertSameCompany(companyId, analysis.getCompanyId());
                return analysis.toDTO();
        }

        /**
         * Cloisonnement par mine : companyId fourni => l'entité doit lui appartenir.
         * companyId null = appel système / toutes mines.
         */
        private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
                if (companyId != null && !companyId.equals(entityCompanyId)) {
                        throw new HSException("ANALYSIS_NOT_FOUND");
                }
        }
}
