package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.OverexposureCaseDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OverexposureCaseServiceImpl implements OverexposureCaseService {

    private final OverexposureCaseRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, OverexposureCaseDTO dto) {
        OverexposureCase e = toEntity(dto);
        LocalDateTime now = LocalDateTime.now();
        if (e.getOpenedAt() == null) e.setOpenedAt(now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        OverexposureCase saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, OverexposureCaseDTO dto) {
        OverexposureCase existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + dto.getId()));
        existing.setLevel(dto.getLevel());
        existing.setCause(dto.getCause());
        existing.setCorrectiveActions(dto.getCorrectiveActions());
        existing.setMedicalDecision(dto.getMedicalDecision());
        existing.setAuthorityDeclaration(dto.isAuthorityDeclaration());
        existing.setAuthorityDeclarationDate(dto.getAuthorityDeclarationDate());
        existing.setStatus(dto.getStatus());
        existing.setClosedAt(dto.getClosedAt());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(dto.getUpdatedBy());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<OverexposureCaseDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public OverexposureCaseDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OverexposureCase not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null);
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("OverexposureCase").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private OverexposureCase toEntity(OverexposureCaseDTO dto) {
        OverexposureCase e = new OverexposureCase();
        e.setId(dto.getId());
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(w);
        e.setLevel(dto.getLevel());
        e.setCause(dto.getCause());
        e.setCorrectiveActions(dto.getCorrectiveActions());
        e.setMedicalDecision(dto.getMedicalDecision());
        e.setAuthorityDeclaration(dto.isAuthorityDeclaration());
        e.setAuthorityDeclarationDate(dto.getAuthorityDeclarationDate());
        e.setStatus(dto.getStatus());
        e.setOpenedAt(dto.getOpenedAt());
        e.setClosedAt(dto.getClosedAt());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private OverexposureCaseDTO toDTO(OverexposureCase e) {
        return new OverexposureCaseDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getLevel(), e.getCause(), e.getCorrectiveActions(),
                e.getMedicalDecision(), e.isAuthorityDeclaration(),
                e.getAuthorityDeclarationDate(), e.getStatus(),
                e.getOpenedAt(), e.getClosedAt(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
