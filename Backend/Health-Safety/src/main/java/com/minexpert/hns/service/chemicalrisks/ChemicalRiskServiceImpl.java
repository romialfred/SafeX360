package com.minexpert.hns.service.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskDTO;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChemicalRiskServiceImpl implements ChemicalRiskService {
    private final ChemicalRiskRepository chemicalRiskRepository;

    @Override
    public ChemicalRiskDTO create(ChemicalRiskDTO dto) throws HSException {
        ChemicalRisk risk = dto.toEntity();
        ChemicalRisk saved = chemicalRiskRepository.save(risk);
        return saved.toDTO();
    }

    @Override
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
        ChemicalRisk updated = chemicalRiskRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    public ChemicalRiskDTO updateStatus(Long id, String status) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        risk.setStatus(status);
        return risk.toDTO();
    }

    @Override
    public ChemicalRiskDTO getById(Long id) throws HSException {
        ChemicalRisk risk = chemicalRiskRepository.findById(id)
                .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
        return risk.toDTO();
    }

    @Override
    public List<ChemicalRiskDTO> getAll() throws HSException {
        return chemicalRiskRepository.findAll()
                .stream()
                .map(ChemicalRisk::toDTO)
                .toList();
    }
}

