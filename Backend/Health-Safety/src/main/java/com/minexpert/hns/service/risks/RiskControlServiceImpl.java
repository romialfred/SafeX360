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
    public List<RiskControlDTO> listByRisk(String sourceType, Long riskId) throws HSException {
        return riskControlRepository.findBySourceTypeAndRiskId(sourceType, riskId)
                .stream()
                .map(RiskControl::toDTO)
                .toList();
    }

    @Override
    public RiskControlDTO update(RiskControlDTO dto) throws HSException {
        RiskControl existing = riskControlRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("RISK_CONTROL_NOT_FOUND"));
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
    public void delete(Long id) throws HSException {
        RiskControl existing = riskControlRepository.findById(id)
                .orElseThrow(() -> new HSException("RISK_CONTROL_NOT_FOUND"));
        riskControlRepository.delete(existing);
    }
}
