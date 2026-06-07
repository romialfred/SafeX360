package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.DosimeterAssignmentDTO;
import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.entity.DosimeterAssignment;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.DosimeterAssignmentRepository;
import com.minexpert.hns.dosimetry.repository.DosimeterRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DosimeterAssignmentServiceImpl implements DosimeterAssignmentService {

    private final DosimeterAssignmentRepository repository;
    private final DosimeterRepository dosimeterRepository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, DosimeterAssignmentDTO dto) {
        DosimeterAssignment e = toEntity(dto);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        DosimeterAssignment saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, DosimeterAssignmentDTO dto) {
        DosimeterAssignment existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("DosimeterAssignment not found: " + dto.getId()));
        copy(dto, existing);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<DosimeterAssignmentDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DosimeterAssignmentDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DosimeterAssignment not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null);
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("DosimeterAssignment").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private DosimeterAssignment toEntity(DosimeterAssignmentDTO dto) {
        DosimeterAssignment e = new DosimeterAssignment();
        e.setId(dto.getId());
        Dosimeter d = dosimeterRepository.findById(dto.getDosimeterId())
                .orElseThrow(() -> new EntityNotFoundException("Dosimeter not found: " + dto.getDosimeterId()));
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setDosimeter(d);
        e.setWorker(w);
        e.setPeriodStart(dto.getPeriodStart());
        e.setPeriodEnd(dto.getPeriodEnd());
        e.setHandoverAck(dto.isHandoverAck());
        e.setHandoverAckAt(dto.getHandoverAckAt());
        e.setReturnAck(dto.isReturnAck());
        e.setReturnAckAt(dto.getReturnAckAt());
        e.setDeviceCondition(dto.getDeviceCondition());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private void copy(DosimeterAssignmentDTO dto, DosimeterAssignment e) {
        e.setPeriodStart(dto.getPeriodStart());
        e.setPeriodEnd(dto.getPeriodEnd());
        e.setHandoverAck(dto.isHandoverAck());
        e.setHandoverAckAt(dto.getHandoverAckAt());
        e.setReturnAck(dto.isReturnAck());
        e.setReturnAckAt(dto.getReturnAckAt());
        e.setDeviceCondition(dto.getDeviceCondition());
        e.setUpdatedBy(dto.getUpdatedBy());
    }

    private DosimeterAssignmentDTO toDTO(DosimeterAssignment e) {
        return new DosimeterAssignmentDTO(e.getId(),
                e.getDosimeter() != null ? e.getDosimeter().getId() : null,
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriodStart(), e.getPeriodEnd(), e.isHandoverAck(),
                e.getHandoverAckAt(), e.isReturnAck(), e.getReturnAckAt(),
                e.getDeviceCondition(), e.getCreatedAt(), e.getUpdatedAt(),
                e.getCreatedBy(), e.getUpdatedBy());
    }
}
