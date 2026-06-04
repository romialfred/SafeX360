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
                        @CacheEvict(cacheNames = "riskAnalysisByRisk", key = "#dto.riskId"),
                        @CacheEvict(cacheNames = "riskAnalysisAll", allEntries = true),
                        @CacheEvict(cacheNames = "riskById", key = "#dto.riskId"),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskAnalysisDTO create(RiskAnalysisDTO dto) throws HSException {
                Risk risk = riskRepository.findById(dto.getRiskId())
                                .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
                risk.setRiskLevel(dto.getRiskLevel());
                riskRepository.save(risk);
                RiskAnalysis analysis = dto.toEntity(risk);
                RiskAnalysis saved = analysisRepository.save(analysis);
                return saved.toDTO();
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "riskAnalysisById", key = "#dto.id"),
                        @CacheEvict(cacheNames = "riskAnalysisByRisk", allEntries = true),
                        @CacheEvict(cacheNames = "riskAnalysisAll", allEntries = true),
                        @CacheEvict(cacheNames = "riskById", allEntries = true),
                        @CacheEvict(cacheNames = "risksAll", allEntries = true),
                        @CacheEvict(cacheNames = "risksWithLevel", allEntries = true),
                        @CacheEvict(cacheNames = "riskSearch", allEntries = true),
                        @CacheEvict(cacheNames = "riskOverview", allEntries = true)
        })
        public RiskAnalysisDTO update(RiskAnalysisDTO dto) throws HSException {
                RiskAnalysis existing = analysisRepository.findById(dto.getId())
                                .orElseThrow(() -> new HSException("ANALYSIS_NOT_FOUND"));
                existing.setGravity(dto.getGravity());
                existing.setProbability(dto.getProbability());
                existing.setSeverity(dto.getSeverity());
                existing.setCurrentControls(dto.getCurrentControls());
                existing.setAdditionalControl(dto.getAdditionalControl());
                existing.setPreventiveMeasures(dto.getPreventiveMeasures());
                existing.setImprovementsMeasures(dto.getImprovementsMeasures());
                existing.setComments(dto.getComments());
                existing.setReason(dto.getReason());
                RiskAnalysis updated = analysisRepository.save(existing);
                return updated.toDTO();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisByRisk", key = "#riskId")
        public List<RiskAnalysisDTO> getByRiskId(Long riskId) throws HSException {
                return analysisRepository.findByRiskId(riskId)
                                .stream()
                                .map(RiskAnalysis::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisAll")
        public List<RiskAnalysisDTO> getAll() throws HSException {
                return analysisRepository.findAll()
                                .stream()
                                .map(RiskAnalysis::toDTO)
                                .toList();
        }

        @Override
        @Cacheable(cacheNames = "riskAnalysisById", key = "#id")
        public RiskAnalysisDTO getById(Long id) throws HSException {
                RiskAnalysis analysis = analysisRepository.findById(id)
                                .orElseThrow(() -> new HSException("ANALYSIS_NOT_FOUND"));
                return analysis.toDTO();
        }
}
