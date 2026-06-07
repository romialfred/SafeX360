package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoseRecordServiceImpl implements DoseRecordService {

    private final DoseRecordRepository repository;
    private final ExposedWorkerRepository workerRepository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public Long create(Long companyId, DoseRecordDTO dto) {
        DoseRecord e = toEntity(dto);
        e.setVersion(1);
        e.setSupersededRecordId(null);
        LocalDateTime now = LocalDateTime.now();
        e.setRecordedAt(dto.getRecordedAt() != null ? dto.getRecordedAt() : now);
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        DoseRecord saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getRecordedBy());
        return saved.getId();
    }

    /**
     * Pattern append-only : on cree un NOUVEAU DoseRecord avec version+1, on fixe
     * supersededRecordId sur l'ancien. Aucun champ metier du record original n'est mute.
     */
    @Override
    @Transactional
    public Long supersede(Long companyId, DoseRecordDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("id required to supersede a DoseRecord");
        }
        DoseRecord previous = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("DoseRecord not found: " + dto.getId()));

        // Cree le nouveau record avec version + 1
        DoseRecord next = toEntity(dto);
        next.setId(null);
        next.setVersion(previous.getVersion() + 1);
        next.setSupersededRecordId(null);
        LocalDateTime now = LocalDateTime.now();
        next.setRecordedAt(now);
        next.setCreatedAt(now);
        next.setUpdatedAt(now);
        DoseRecord saved = repository.save(next);

        // Chaine : l'ancien pointe vers le nouveau via son champ supersededRecordId
        // (seul champ mutable du record - cf. javadoc entite).
        previous.setSupersededRecordId(saved.getId());
        repository.save(previous);

        audit("UPDATE", saved.getId(), dto.getUpdatedBy());
        return saved.getId();
    }

    @Override
    public List<DoseRecordDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public DoseRecordDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DoseRecord not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        // AIEA GSR Part 3 §3.106 — les enregistrements de dose individuelle sont append-only :
        // toute correction passe par supersede() (creation d'une nouvelle version, l'ancien record
        // est marque via supersededRecordId). Une suppression effacerait la chaine d'audit.
        throw new UnsupportedOperationException(
                "DoseRecord delete forbidden by AIEA GSR Part 3 §3.106. Use supersede() to correct a record.");
    }

    @Override
    public List<DoseRecordDTO> getActiveByWorkerId(Long workerId) {
        return repository.findActiveByWorkerId(workerId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("DoseRecord").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private DoseRecord toEntity(DoseRecordDTO dto) {
        DoseRecord e = new DoseRecord();
        e.setId(dto.getId());
        ExposedWorker w = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new EntityNotFoundException("Worker not found: " + dto.getWorkerId()));
        e.setWorker(w);
        e.setPeriod(dto.getPeriod());
        e.setHp10(dto.getHp10());
        e.setHp007(dto.getHp007());
        e.setHp3(dto.getHp3());
        e.setSource(dto.getSource());
        e.setBelowDetection(dto.isBelowDetection());
        e.setAttachmentUrls(dto.getAttachmentUrls());
        e.setNotes(dto.getNotes());
        e.setRecordedBy(dto.getRecordedBy() != null ? dto.getRecordedBy() : 0L);
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private DoseRecordDTO toDTO(DoseRecord e) {
        return new DoseRecordDTO(e.getId(),
                e.getWorker() != null ? e.getWorker().getId() : null,
                e.getPeriod(), e.getHp10(), e.getHp007(), e.getHp3(), e.getSource(),
                e.isBelowDetection(), e.getAttachmentUrls(), e.getNotes(),
                e.getRecordedBy(), e.getRecordedAt(), e.getVersion(), e.getSupersededRecordId(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
