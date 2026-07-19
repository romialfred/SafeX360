package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskControlDTO;
import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import com.minexpert.hns.entity.risks.Risk;
import com.minexpert.hns.entity.risks.RiskControl;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.chemicalrisks.ChemicalRiskRepository;
import com.minexpert.hns.repository.risks.RiskControlRepository;
import com.minexpert.hns.repository.risks.RiskRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class RiskControlServiceImpl implements RiskControlService {
    private final RiskControlRepository riskControlRepository;
    private final RiskRepository riskRepository;
    private final ChemicalRiskRepository chemicalRiskRepository;

    @Override
    public RiskControlDTO create(RiskControlDTO dto) throws HSException {
        // Un controle (mesure de maitrise) HERITE TOUJOURS de la mine de son entite
        // parente — comme RiskAnalysisServiceImpl.create derive du risque parent. On
        // ne fait donc PAS confiance au companyId eventuellement porte par le DTO
        // client : la mine vient de la SOURCE DE VERITE (le risque ou le risque
        // chimique parent, selon sourceType). Cela evite un controle orphelin
        // (companyId nul) OU rattache a une autre mine que son parent.
        String sourceType = dto.getSourceType();
        Long parentCompanyId;
        if (sourceType != null && sourceType.trim().toUpperCase().startsWith("CHEMICAL")) {
            ChemicalRisk parent = chemicalRiskRepository.findById(dto.getRiskId())
                    .orElseThrow(() -> new HSException("CHEMICAL_RISK_NOT_FOUND"));
            parentCompanyId = parent.getCompanyId();
        } else {
            Risk parent = riskRepository.findById(dto.getRiskId())
                    .orElseThrow(() -> new HSException("RISK_NOT_FOUND"));
            parentCompanyId = parent.getCompanyId();
        }
        dto.setCompanyId(parentCompanyId);
        RiskControl control = dto.toEntity();
        RiskControl saved = riskControlRepository.save(control);
        return saved.toDTO();
    }

    @Override
    public List<RiskControlDTO> listByRisk(String sourceType, Long riskId, Long companyId) throws HSException {
        return riskControlRepository.findBySourceTypeAndRiskIdAndCompany(sourceType, riskId, companyId)
                .stream()
                .map(RiskControl::toDTO)
                .toList();
    }

    @Override
    public RiskControlDTO update(RiskControlDTO dto, Long companyId) throws HSException {
        RiskControl existing = riskControlRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("RISK_CONTROL_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
        existing.setSourceType(dto.getSourceType());
        existing.setRiskId(dto.getRiskId());
        existing.setControlType(dto.getControlType());
        existing.setDescription(dto.getDescription());
        existing.setResponsibleId(dto.getResponsibleId());
        existing.setDueDate(dto.getDueDate());
        existing.setStatus(dto.getStatus());
        RiskControl updated = riskControlRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    public void delete(Long id, Long companyId) throws HSException {
        RiskControl existing = riskControlRepository.findById(id)
                .orElseThrow(() -> new HSException("RISK_CONTROL_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
        riskControlRepository.delete(existing);
    }

    /**
     * Cloisonnement par mine : companyId fourni => l'entité doit lui appartenir.
     * companyId null = appel système / toutes mines.
     */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("RISK_CONTROL_NOT_FOUND");
        }
    }
}
