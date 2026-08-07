package com.minexpert.hns.service.compliance;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.CompanyScopeGuard;
import com.minexpert.hns.dto.compliance.RegulatoryObligationDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.RegulatoryObligation;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.RegulatoryObligationRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRE DES OBLIGATIONS REGLEMENTAIRES — logique metier, cloisonnee par mine.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RegulatoryObligationServiceImpl implements RegulatoryObligationService {

    private final RegulatoryObligationRepository repository;
    private final MediaService mediaService;
    private final CompanyScopeGuard companyScopeGuard;

    @Override
    public Long create(RegulatoryObligationDTO dto, Long companyId) throws HSException {
        companyScopeGuard.assertInScope(companyId);
        RegulatoryObligation e = dto.toEntity();
        e.setId(null);
        e.setCompanyId(companyId);
        e.setStatus(Status.ACTIVE);
        e.setMedia(persistMediaIfPresent(dto));
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e).getId();
    }

    @Override
    public void update(RegulatoryObligationDTO dto) throws HSException {
        RegulatoryObligation existing = repository.findById(dto.getId())
                .orElseThrow(() -> new HSException("REGULATORY_OBLIGATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(existing.getCompanyId());

        existing.setCategory(dto.getCategory());
        existing.setReference(dto.getReference());
        existing.setTitle(dto.getTitle());
        existing.setArticle(dto.getArticle());
        existing.setDomain(dto.getDomain());
        existing.setAuthority(dto.getAuthority());
        existing.setDescription(dto.getDescription());
        existing.setComplianceStatus(dto.getComplianceStatus());
        existing.setActionRequired(dto.getActionRequired());
        existing.setApplicableSince(dto.getApplicableSince());
        existing.setLastReviewDate(dto.getLastReviewDate());
        existing.setNextReviewDate(dto.getNextReviewDate());
        existing.setResponsibleEmployeeId(dto.getResponsibleEmployeeId());
        existing.setNotes(dto.getNotes());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        Media replacement = persistMediaIfPresent(dto);
        if (replacement != null) {
            existing.setMedia(replacement);
        }
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
    }

    @Override
    public void activate(Long id) throws HSException {
        setStatus(id, Status.ACTIVE);
    }

    @Override
    public void deactivate(Long id) throws HSException {
        setStatus(id, Status.INACTIVE);
    }

    @Override
    public RegulatoryObligationDTO getById(Long id) throws HSException {
        RegulatoryObligation e = repository.findById(id)
                .orElseThrow(() -> new HSException("REGULATORY_OBLIGATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        return e.toDTO();
    }

    @Override
    public List<RegulatoryObligationDTO> getAll(Long companyId) throws HSException {
        return repository.findAllByCompany(companyId).stream().map(RegulatoryObligation::toDTO).toList();
    }

    private void setStatus(Long id, Status status) throws HSException {
        RegulatoryObligation e = repository.findById(id)
                .orElseThrow(() -> new HSException("REGULATORY_OBLIGATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        e.setStatus(status);
        e.setUpdatedAt(LocalDateTime.now());
        repository.save(e);
    }

    private Media persistMediaIfPresent(RegulatoryObligationDTO dto) throws HSException {
        if (dto.getMedia() == null || dto.getMedia().getFile() == null
                || dto.getMedia().getFile().isBlank()) {
            return null;
        }
        Long mediaId = mediaService.saveMedia(dto.getMedia());
        Media m = new Media();
        m.setId(mediaId);
        return m;
    }
}
