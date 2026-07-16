package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.ExposedWorkerDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExposedWorkerServiceImpl implements ExposedWorkerService {

    private final ExposedWorkerRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, ExposedWorkerDTO dto) {
        ExposedWorker entity = toEntity(dto);
        entity.setMineId(companyId);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        ExposedWorker saved = repository.save(entity);

        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("CREATE")
                .entityType("ExposedWorker")
                .entityId(saved.getId())
                .userId(dto.getCreatedBy() != null ? dto.getCreatedBy() : 0L)
                .timestamp(LocalDateTime.now())
                .build());

        return saved.getId();
    }

    @Override
    public void update(Long companyId, ExposedWorkerDTO dto) {
        ExposedWorker existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("ExposedWorker not found: " + dto.getId()));
        copy(dto, existing);
        existing.setMineId(companyId);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);

        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("UPDATE")
                .entityType("ExposedWorker")
                .entityId(existing.getId())
                .userId(dto.getUpdatedBy() != null ? dto.getUpdatedBy() : 0L)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @Override
    public List<ExposedWorkerDTO> getAll(Long companyId) {
        return repository.findByMineId(companyId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ExposedWorkerDTO getById(Long id, Long userId, String userPermissions) {
        ExposedWorker entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ExposedWorker not found: " + id));

        // Audit RBAC fin : lecture nominative de dose - trace user + ses permissions
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("VIEW_NOMINATIVE_DOSE")
                .entityType("ExposedWorker")
                .entityId(id)
                .userId(userId != null ? userId : 0L)
                .userPermissions(userPermissions)
                .timestamp(LocalDateTime.now())
                .build());

        return toDTO(entity);
    }

    @Override
    public void delete(Long id, Long userId) {
        repository.deleteById(id);
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("DELETE")
                .entityType("ExposedWorker")
                .entityId(id)
                .userId(userId != null ? userId : 0L)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private ExposedWorker toEntity(ExposedWorkerDTO dto) {
        ExposedWorker e = new ExposedWorker();
        e.setId(dto.getId());
        e.setEmployeeId(dto.getEmployeeId());
        e.setCategory(dto.getCategory());
        e.setClassificationReason(dto.getClassificationReason());
        e.setClassificationDate(dto.getClassificationDate());
        e.setRpoId(dto.getRpoId());
        e.setSpecialStatus(dto.getSpecialStatus());
        e.setSpecialStatusStartDate(dto.getSpecialStatusStartDate());
        e.setSpecialStatusEndDate(dto.getSpecialStatusEndDate());
        e.setActive(dto.isActive());
        e.setMineId(dto.getMineId());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        e.setAssignmentDate(dto.getAssignmentDate());
        return e;
    }

    private void copy(ExposedWorkerDTO dto, ExposedWorker e) {
        e.setEmployeeId(dto.getEmployeeId());
        e.setCategory(dto.getCategory());
        e.setClassificationReason(dto.getClassificationReason());
        e.setClassificationDate(dto.getClassificationDate());
        e.setRpoId(dto.getRpoId());
        e.setSpecialStatus(dto.getSpecialStatus());
        e.setSpecialStatusStartDate(dto.getSpecialStatusStartDate());
        e.setSpecialStatusEndDate(dto.getSpecialStatusEndDate());
        e.setActive(dto.isActive());
        e.setUpdatedBy(dto.getUpdatedBy());
        e.setAssignmentDate(dto.getAssignmentDate());
    }

    private ExposedWorkerDTO toDTO(ExposedWorker e) {
        return new ExposedWorkerDTO(e.getId(), e.getEmployeeId(), e.getCategory(),
                e.getClassificationReason(), e.getClassificationDate(), e.getRpoId(),
                e.getSpecialStatus(), e.getSpecialStatusStartDate(), e.getSpecialStatusEndDate(),
                e.isActive(), e.getMineId(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy(), e.getAssignmentDate());
    }
}
