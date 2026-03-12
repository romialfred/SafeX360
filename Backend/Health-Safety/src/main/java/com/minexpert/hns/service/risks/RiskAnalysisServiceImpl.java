package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskAnalysisDTO;
import com.minexpert.hns.entity.risks.RiskAnalysis;
import com.minexpert.hns.entity.risks.Risk;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.risks.RiskAnalysisRepository;
import com.minexpert.hns.repository.risks.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskAnalysisServiceImpl implements RiskAnalysisService {
    private final RiskAnalysisRepository analysisRepository;
    private final RiskRepository riskRepository;

    @Override
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
    public List<RiskAnalysisDTO> getByRiskId(Long riskId) throws HSException {
        return analysisRepository.findByRiskId(riskId)
                .stream()
                .map(RiskAnalysis::toDTO)
                .toList();
    }

    @Override
    public List<RiskAnalysisDTO> getAll() throws HSException {
        return analysisRepository.findAll()
                .stream()
                .map(RiskAnalysis::toDTO)
                .toList();
    }

    @Override
    public RiskAnalysisDTO getById(Long id) throws HSException {
        RiskAnalysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new HSException("ANALYSIS_NOT_FOUND"));
        return analysis.toDTO();
    }
}
