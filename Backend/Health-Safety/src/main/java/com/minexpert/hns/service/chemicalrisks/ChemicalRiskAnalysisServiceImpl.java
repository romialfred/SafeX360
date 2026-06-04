package com.minexpert.hns.service.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRiskAnalysis;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskAnalysisRepository;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ChemicalRiskAnalysisServiceImpl implements ChemicalRiskAnalysisService {
    private final ChemicalRiskAnalysisRepository analysisRepository;
    private final ChemicalRiskRepository chemicalRiskRepository;

    @Override
    public ChemicalRiskAnalysisDTO create(ChemicalRiskAnalysisDTO dto) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(dto.getRiskId())
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        // Keep the latest assessment's risk level on the parent record, mirroring RiskAnalysis
        risk.setRiskLevel(dto.getRiskLevel());
        chemicalRiskRepository.save(risk);
        ChemicalRiskAnalysis analysis = dto.toEntity(risk);
        ChemicalRiskAnalysis saved = analysisRepository.save(analysis);
        return saved.toDTO();
    }

    @Override
    public ChemicalRiskAnalysisDTO update(ChemicalRiskAnalysisDTO dto) throws HSException {
        ChemicalRiskAnalysis existing = analysisRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("CHEMICAL_ANALYSIS_NOT_FOUND"));
        existing.setGravity(dto.getGravity());
        existing.setProbability(dto.getProbability());
        existing.setSeverity(dto.getSeverity());
        existing.setCurrentControls(dto.getCurrentControls());
        existing.setAdditionalControl(dto.getAdditionalControl());
        existing.setPreventiveMeasures(dto.getPreventiveMeasures());
        existing.setImprovementsMeasures(dto.getImprovementsMeasures());
        existing.setComments(dto.getComments());
        existing.setReason(dto.getReason());
        ChemicalRiskAnalysis updated = analysisRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    public List<ChemicalRiskAnalysisDTO> getByRiskId(Long riskId) throws HSException {
        return analysisRepository.findByChemicalRiskId(riskId)
                .stream()
                .map(ChemicalRiskAnalysis::toDTO)
                .toList();
    }

    @Override
    public List<ChemicalRiskAnalysisDTO> getAll() throws HSException {
        return analysisRepository.findAll()
                .stream()
                .map(ChemicalRiskAnalysis::toDTO)
                .toList();
    }

    @Override
    public ChemicalRiskAnalysisDTO getById(Long id) throws HSException {
        ChemicalRiskAnalysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_ANALYSIS_NOT_FOUND"));
        return analysis.toDTO();
    }
}

