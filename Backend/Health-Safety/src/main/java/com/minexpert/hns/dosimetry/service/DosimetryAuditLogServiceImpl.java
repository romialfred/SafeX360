package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.DosimetryAuditLogDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DosimetryAuditLogServiceImpl implements DosimetryAuditLogService {

    private final DosimetryAuditLogRepository repository;

    @Override
    public Long create(Long companyId, DosimetryAuditLogDTO dto) {
        DosimetryAuditLog e = DosimetryAuditLog.builder()
                .action(dto.getAction())
                .entityType(dto.getEntityType())
                .entityId(dto.getEntityId())
                .userId(dto.getUserId())
                .userPermissions(dto.getUserPermissions())
                .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now())
                .ipAddress(dto.getIpAddress())
                .details(dto.getDetails())
                .build();
        return repository.save(e).getId();
    }

    @Override
    public List<DosimetryAuditLogDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DosimetryAuditLogDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DosimetryAuditLog not found: " + id)));
    }

    private DosimetryAuditLogDTO toDTO(DosimetryAuditLog e) {
        return new DosimetryAuditLogDTO(e.getId(), e.getAction(), e.getEntityType(),
                e.getEntityId(), e.getUserId(), e.getUserPermissions(), e.getTimestamp(),
                e.getIpAddress(), e.getDetails());
    }
}
