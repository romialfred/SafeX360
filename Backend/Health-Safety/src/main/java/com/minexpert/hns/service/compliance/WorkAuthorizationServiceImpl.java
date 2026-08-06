package com.minexpert.hns.service.compliance;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.CompanyScopeGuard;
import com.minexpert.hns.dto.compliance.WorkAuthorizationDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.WorkAuthorization;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.WorkAuthorizationRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRE DES AUTORISATIONS DE TRAVAUX — logique metier, cloisonnee par mine.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class WorkAuthorizationServiceImpl implements WorkAuthorizationService {

    private final WorkAuthorizationRepository repository;
    private final MediaService mediaService;
    private final CompanyScopeGuard companyScopeGuard;

    @Override
    public Long create(WorkAuthorizationDTO dto, Long companyId) throws HSException {
        companyScopeGuard.assertInScope(companyId);
        WorkAuthorization e = dto.toEntity();
        e.setId(null);
        e.setCompanyId(companyId);
        e.setStatus(Status.ACTIVE);
        e.setMedia(persistMediaIfPresent(dto));
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e).getId();
    }

    @Override
    public void update(WorkAuthorizationDTO dto) throws HSException {
        WorkAuthorization existing = repository.findById(dto.getId())
                .orElseThrow(() -> new HSException("WORK_AUTHORIZATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(existing.getCompanyId());

        existing.setAuthorizationType(dto.getAuthorizationType());
        existing.setReference(dto.getReference());
        existing.setTitle(dto.getTitle());
        existing.setZone(dto.getZone());
        existing.setRequestedByEmployeeId(dto.getRequestedByEmployeeId());
        existing.setApprovedByEmployeeId(dto.getApprovedByEmployeeId());
        existing.setIssueDate(dto.getIssueDate());
        existing.setValidFrom(dto.getValidFrom());
        existing.setValidTo(dto.getValidTo());
        existing.setRiskLevel(dto.getRiskLevel());
        existing.setPrecautions(dto.getPrecautions());
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
    public void close(Long id) throws HSException {
        setStatus(id, Status.INACTIVE);
    }

    @Override
    public void reopen(Long id) throws HSException {
        setStatus(id, Status.ACTIVE);
    }

    @Override
    public WorkAuthorizationDTO getById(Long id) throws HSException {
        WorkAuthorization e = repository.findById(id)
                .orElseThrow(() -> new HSException("WORK_AUTHORIZATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        return e.toDTO();
    }

    @Override
    public List<WorkAuthorizationDTO> getAll(Long companyId) throws HSException {
        return repository.findAllByCompany(companyId).stream().map(WorkAuthorization::toDTO).toList();
    }

    private void setStatus(Long id, Status status) throws HSException {
        WorkAuthorization e = repository.findById(id)
                .orElseThrow(() -> new HSException("WORK_AUTHORIZATION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        e.setStatus(status);
        e.setUpdatedAt(LocalDateTime.now());
        repository.save(e);
    }

    private Media persistMediaIfPresent(WorkAuthorizationDTO dto) throws HSException {
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
