package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.ExposureAlertDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExposureAlertServiceImpl implements ExposureAlertService {

    private final ExposureAlertRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, ExposureAlertDTO dto) {
        ExposureAlert e = toEntity(dto);
        LocalDateTime now = LocalDateTime.now();
        if (e.getTriggeredAt() == null) e.setTriggeredAt(now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        ExposureAlert saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, ExposureAlertDTO dto) {
        ExposureAlert existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + dto.getId()));
        existing.setWorkerId(dto.getWorkerId());
        existing.setZoneId(dto.getZoneId());
        existing.setLevel(dto.getLevel());
        existing.setGrandeur(dto.getGrandeur());
        existing.setValue(dto.getValue());
        existing.setThresholdId(dto.getThresholdId());
        existing.setAcknowledgedAt(dto.getAcknowledgedAt());
        existing.setAcknowledgedBy(dto.getAcknowledgedBy());
        existing.setStatus(dto.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(dto.getUpdatedBy());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<ExposureAlertDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ExposureAlertDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ExposureAlert not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        // Une alerte ne se supprime pas : on l'acquitte (ACK) ou on la cloture (RESOLVED).
        // Cela preserve la chaine d'audit attendue par la radioprotection.
        throw new UnsupportedOperationException(
                "ExposureAlert delete forbidden — use acknowledge() or resolve() to close.");
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("ExposureAlert").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private ExposureAlert toEntity(ExposureAlertDTO dto) {
        ExposureAlert e = new ExposureAlert();
        e.setId(dto.getId());
        e.setWorkerId(dto.getWorkerId());
        e.setZoneId(dto.getZoneId());
        e.setLevel(dto.getLevel());
        e.setGrandeur(dto.getGrandeur());
        e.setValue(dto.getValue());
        e.setThresholdId(dto.getThresholdId());
        e.setTriggeredAt(dto.getTriggeredAt());
        e.setAcknowledgedAt(dto.getAcknowledgedAt());
        e.setAcknowledgedBy(dto.getAcknowledgedBy());
        e.setStatus(dto.getStatus());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private ExposureAlertDTO toDTO(ExposureAlert e) {
        return new ExposureAlertDTO(e.getId(), e.getWorkerId(), e.getZoneId(),
                e.getLevel(), e.getGrandeur(), e.getValue(), e.getThresholdId(),
                e.getTriggeredAt(), e.getAcknowledgedAt(), e.getAcknowledgedBy(),
                e.getStatus(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }
}
