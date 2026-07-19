package com.minexpert.hns.service.risks;

import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.entity.risks.Opportunity;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.risks.OpportunityRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class OpportunityServiceImpl implements OpportunityService {
    private final OpportunityRepository opportunityRepository;

    @Override
    public OpportunityDTO create(OpportunityDTO dto) throws HSException {
        // Une opportunite SST SANS mine (companyId absent) devient une entite
        // orpheline, invisible des qu'une mine est selectionnee. On refuse la
        // creation silencieuse (doctrine COMPANY_ID_REQUIRED). Le companyId est
        // injecte dans le DTO par le controller depuis la mine active du header.
        if (dto.getCompanyId() == null || dto.getCompanyId() <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        Opportunity opportunity = dto.toEntity();
        Opportunity saved = opportunityRepository.save(opportunity);
        return saved.toDTO();
    }

    @Override
    public List<OpportunityDTO> list(Long companyId) throws HSException {
        return opportunityRepository.findAllByCompanyOrderByCreatedAtDesc(companyId)
                .stream()
                .map(Opportunity::toDTO)
                .toList();
    }

    @Override
    public OpportunityDTO getById(Long id, Long companyId) throws HSException {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        assertSameCompany(companyId, opportunity.getCompanyId());
        return opportunity.toDTO();
    }

    @Override
    public OpportunityDTO update(OpportunityDTO dto, Long companyId) throws HSException {
        Opportunity existing = opportunityRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
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
    public OpportunityDTO updateStatus(Long id, String status, Long companyId) throws HSException {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        assertSameCompany(companyId, opportunity.getCompanyId());
        assertOpportunityStatus(status);
        opportunity.setStatus(status);
        Opportunity updated = opportunityRepository.save(opportunity);
        return updated.toDTO();
    }

    /**
     * Cloisonnement par mine : companyId fourni => l'entité doit lui appartenir.
     * companyId null = appel système / toutes mines.
     */
    private void assertSameCompany(Long companyId, Long entityCompanyId) throws HSException {
        if (companyId != null && !companyId.equals(entityCompanyId)) {
            throw new HSException("OPPORTUNITY_NOT_FOUND");
        }
    }

    private static final Set<String> VALID_OPPORTUNITY_STATUSES = Set.of(
            "IDENTIFIED", "EVALUATED", "PLANNED", "IN_PROGRESS", "REALIZED", "CLOSED");

    private void assertOpportunityStatus(String status) throws HSException {
        if (status == null || !VALID_OPPORTUNITY_STATUSES.contains(status.toUpperCase())) {
            throw new HSException("INVALID_OPPORTUNITY_STATUS");
        }
    }

    @Override
    public void delete(Long id, Long companyId) throws HSException {
        Opportunity existing = opportunityRepository.findById(id)
                .orElseThrow(() -> new HSException("OPPORTUNITY_NOT_FOUND"));
        assertSameCompany(companyId, existing.getCompanyId());
        opportunityRepository.delete(existing);
    }
}
