package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.RiskControlDTO;
import com.minexpert.hns.entity.risks.RiskControl;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.risks.RiskControlRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class RiskControlServiceImpl implements RiskControlService {
    private final RiskControlRepository riskControlRepository;

    @Override
    public RiskControlDTO create(RiskControlDTO dto) throws HSException {
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
