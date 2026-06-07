package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.MedicalSurveillanceDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.MedicalSurveillance;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.MedicalSurveillanceRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Service de gestion du suivi medical. Toute lecture est tracee dans le journal d'audit
 * (donnees CONFIDENTIELLES - role MEDECIN uniquement, controle via @PreAuthorize cote controller).
 */
@Service
@RequiredArgsConstructor
public class MedicalSurveillanceServiceImpl implements MedicalSurveillanceService {

    private final MedicalSurveillanceRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, MedicalSurveillanceDTO dto, Long userId) {
        MedicalSurveillance e = toEntity(dto);
        LocalDateTime now = LocalDateTime.now();
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        MedicalSurveillance saved = repository.save(e);
        audit("CREATE", saved.getId(), userId);
        return saved.getId();
    }

    @Override
    public void update(Long companyId, MedicalSurveillanceDTO dto, Long userId) {
        MedicalSurveillance existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("MedicalSurveillance not found: " + dto.getId()));
        existing.setType(dto.getType());
        existing.setFitness(dto.getFitness());
        existing.setExamDate(dto.getExamDate());
        existing.setNextDueDate(dto.getNextDueDate());
        existing.setRestrictedClinicalDetails(dto.getRestrictedClinicalDetails());
        existing.setDoctorId(dto.getDoctorId());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        repository.save(existing);
        audit("UPDATE", existing.getId(), userId);
    }

    @Override
    public List<MedicalSurveillanceDTO> getAll(Long companyId, Long userId) {
        // Trace : lecture du dossier medical (donnees sensibles).
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action("READ").entityType("MedicalSurveillance").entityId(null)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public MedicalSurveillanceDTO getById(Long id, Long userId) {
        MedicalSurveillance e = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MedicalSurveillance not found: " + id));
        audit("READ", id, userId);
        return toDTO(e);
    }

    @Override
    public void delete(Long id, Long userId) {
        repository.deleteById(id);
        audit("DELETE", id, userId);
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("MedicalSurveillance").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private MedicalSurveillance toEntity(MedicalSurveillanceDTO dto) {
        MedicalSurveillance e = new MedicalSurveillance();
        e.setId(dto.getId());
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(w);
        e.setType(dto.getType());
        e.setFitness(dto.getFitness());
        e.setExamDate(dto.getExamDate());
        e.setNextDueDate(dto.getNextDueDate());
        e.setRestrictedClinicalDetails(dto.getRestrictedClinicalDetails());
        e.setDoctorId(dto.getDoctorId());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private MedicalSurveillanceDTO toDTO(MedicalSurveillance e) {
        return new MedicalSurveillanceDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getType(), e.getFitness(), e.getExamDate(), e.getNextDueDate(),
                e.getRestrictedClinicalDetails(), e.getDoctorId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
