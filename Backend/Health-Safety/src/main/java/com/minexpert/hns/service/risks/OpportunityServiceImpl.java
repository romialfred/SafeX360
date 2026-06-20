package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.entity.risks.Opportunity;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.risks.OpportunityRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class OpportunityServiceImpl implements OpportunityService {
    private final OpportunityRepository opportunityRepository;

    @Override
    public OpportunityDTO create(OpportunityDTO dto) throws HSException {
        Opportunity opportunity = dto.toEntity();
        Opportunity saved = opportunityRepository.save(opportunity);
        return saved.toDTO();
    }

    @Override
    public List<OpportunityDTO> list() throws HSException {
        return opportunityRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(Opportunity::toDTO)
                .toList();
    }

    @Override
    public OpportunityDTO getById(Long id) throws HSException {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        return opportunity.toDTO();
    }

    @Override
    public OpportunityDTO update(OpportunityDTO dto) throws HSException {
        Opportunity existing = opportunityRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setCategory(dto.getCategory());
        existing.setExpectedBenefit(dto.getExpectedBenefit());
        existing.setDepartmentId(dto.getDepartmentId());
        existing.setOwnerId(dto.getOwnerId());
        existing.setStatus(dto.getStatus());
        existing.setTargetDate(dto.getTargetDate());
        Opportunity updated = opportunityRepository.save(existing);
        return updated.toDTO();
    }

    @Override
    public OpportunityDTO updateStatus(Long id, String status) throws HSException {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        opportunity.setStatus(status);
        Opportunity updated = opportunityRepository.save(opportunity);
        return updated.toDTO();
    }

    @Override
    public void delete(Long id) throws HSException {
        Opportunity existing = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        opportunityRepository.delete(existing);
    }
}
