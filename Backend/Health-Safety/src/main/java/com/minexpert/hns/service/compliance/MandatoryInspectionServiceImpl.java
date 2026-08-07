package com.minexpert.hns.service.compliance;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.config.CompanyScopeGuard;
import com.minexpert.hns.dto.compliance.MandatoryInspectionDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.MandatoryInspection;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.compliance.MandatoryInspectionRepository;
import com.minexpert.hns.service.MediaService;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRE DES INSPECTIONS REGLEMENTAIRES — logique metier, cloisonnee par mine.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class MandatoryInspectionServiceImpl implements MandatoryInspectionService {

    private final MandatoryInspectionRepository repository;
    private final MediaService mediaService;
    private final CompanyScopeGuard companyScopeGuard;

    @Override
    public Long create(MandatoryInspectionDTO dto, Long companyId) throws HSException {
        companyScopeGuard.assertInScope(companyId);
        MandatoryInspection e = dto.toEntity();
        e.setId(null);
        e.setCompanyId(companyId);
        e.setStatus(Status.ACTIVE);
        e.setMedia(persistMediaIfPresent(dto));
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return repository.save(e).getId();
    }

    @Override
    public void update(MandatoryInspectionDTO dto) throws HSException {
        MandatoryInspection existing = repository.findById(dto.getId())
                .orElseThrow(() -> new HSException("MANDATORY_INSPECTION_NOT_FOUND"));
        companyScopeGuard.assertInScope(existing.getCompanyId());

        existing.setEquipmentType(dto.getEquipmentType());
        existing.setEquipmentRef(dto.getEquipmentRef());
        existing.setTitle(dto.getTitle());
        existing.setInspectionType(dto.getInspectionType());
        existing.setInspectionBody(dto.getInspectionBody());
        existing.setFrequencyMonths(dto.getFrequencyMonths());
        existing.setLastInspectionDate(dto.getLastInspectionDate());
        existing.setNextInspectionDate(dto.getNextInspectionDate());
        existing.setResult(dto.getResult());
        existing.setCertificateNumber(dto.getCertificateNumber());
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
    public MandatoryInspectionDTO getById(Long id) throws HSException {
        MandatoryInspection e = repository.findById(id)
                .orElseThrow(() -> new HSException("MANDATORY_INSPECTION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        return e.toDTO();
    }

    @Override
    public List<MandatoryInspectionDTO> getAll(Long companyId) throws HSException {
        return repository.findAllByCompany(companyId).stream().map(MandatoryInspection::toDTO).toList();
    }

    private void setStatus(Long id, Status status) throws HSException {
        MandatoryInspection e = repository.findById(id)
                .orElseThrow(() -> new HSException("MANDATORY_INSPECTION_NOT_FOUND"));
        companyScopeGuard.assertInScope(e.getCompanyId());
        e.setStatus(status);
        e.setUpdatedAt(LocalDateTime.now());
        repository.save(e);
    }

    private Media persistMediaIfPresent(MandatoryInspectionDTO dto) throws HSException {
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
