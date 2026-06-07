package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.DosimeterDTO;
import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.repository.DosimeterRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DosimeterServiceImpl implements DosimeterService {

    private final DosimeterRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, DosimeterDTO dto) {
        Dosimeter e = toEntity(dto);
        e.setMineId(companyId);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        Dosimeter saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, DosimeterDTO dto) {
        Dosimeter existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Dosimeter not found: " + dto.getId()));
        copy(dto, existing);
        existing.setMineId(companyId);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<DosimeterDTO> getAll(Long companyId) {
        return repository.findByMineId(companyId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DosimeterDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dosimeter not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null);
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("Dosimeter").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private Dosimeter toEntity(DosimeterDTO dto) {
        Dosimeter e = new Dosimeter();
        e.setId(dto.getId());
        e.setSerial(dto.getSerial());
        e.setType(dto.getType());
        e.setQrCode(dto.getQrCode());
        e.setStatus(dto.getStatus());
        e.setCalibrationDueDate(dto.getCalibrationDueDate());
        e.setMineId(dto.getMineId());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private void copy(DosimeterDTO dto, Dosimeter e) {
        e.setSerial(dto.getSerial());
        e.setType(dto.getType());
        e.setQrCode(dto.getQrCode());
        e.setStatus(dto.getStatus());
        e.setCalibrationDueDate(dto.getCalibrationDueDate());
        e.setUpdatedBy(dto.getUpdatedBy());
    }

    private DosimeterDTO toDTO(Dosimeter e) {
        return new DosimeterDTO(e.getId(), e.getSerial(), e.getType(), e.getQrCode(),
                e.getStatus(), e.getCalibrationDueDate(), e.getMineId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
