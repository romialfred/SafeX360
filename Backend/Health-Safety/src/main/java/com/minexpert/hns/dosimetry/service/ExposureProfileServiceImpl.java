package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.ExposureProfileDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureProfile;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.ExposureProfileRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExposureProfileServiceImpl implements ExposureProfileService {

    private final ExposureProfileRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, ExposureProfileDTO dto) {
        ExposureProfile e = toEntity(dto);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        ExposureProfile saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, ExposureProfileDTO dto) {
        ExposureProfile existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("ExposureProfile not found: " + dto.getId()));
        copy(dto, existing);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<ExposureProfileDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ExposureProfileDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ExposureProfile not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null);
    }

    @Override
    public List<ExposureProfileDTO> getByWorkerId(Long workerId) {
        return repository.findByWorkerId(workerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("ExposureProfile").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private ExposureProfile toEntity(ExposureProfileDTO dto) {
        ExposureProfile e = new ExposureProfile();
        e.setId(dto.getId());
        ExposedWorker worker = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(worker);
        e.setExposureType(dto.getExposureType());
        e.setZoneId(dto.getZoneId());
        e.setPostId(dto.getPostId());
        e.setFrequency(dto.getFrequency());
        e.setConditions(dto.getConditions());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private void copy(ExposureProfileDTO dto, ExposureProfile e) {
        e.setExposureType(dto.getExposureType());
        e.setZoneId(dto.getZoneId());
        e.setPostId(dto.getPostId());
        e.setFrequency(dto.getFrequency());
        e.setConditions(dto.getConditions());
        e.setUpdatedBy(dto.getUpdatedBy());
    }

    private ExposureProfileDTO toDTO(ExposureProfile e) {
        return new ExposureProfileDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getExposureType(), e.getZoneId(), e.getPostId(), e.getFrequency(),
                e.getConditions(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }
}
