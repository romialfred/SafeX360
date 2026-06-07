package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.dto.ThresholdDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ThresholdServiceImpl implements ThresholdService {

    private final ThresholdRepository repository;
    private final DosimetryAuditLogRepository auditLogRepository;

    @Override
    public Long create(Long companyId, ThresholdDTO dto) {
        Threshold e = toEntity(dto);
        // mineId nullable (seuils globaux par defaut). Si non fourni, on hydrate avec companyId.
        if (e.getMineId() == null && dto.getMineId() != null) {
            e.setMineId(dto.getMineId());
        }
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        Threshold saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, ThresholdDTO dto) {
        Threshold existing = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Threshold not found: " + dto.getId()));
        existing.setMineId(dto.getMineId());
        existing.setGrandeur(dto.getGrandeur());
        existing.setPersonCategory(dto.getPersonCategory());
        existing.setDoseConstraint(dto.getDoseConstraint());
        existing.setInvestigationLevel(dto.getInvestigationLevel());
        existing.setActionLevel(dto.getActionLevel());
        existing.setRegulatoryLimit(dto.getRegulatoryLimit());
        existing.setWarnPercentages(dto.getWarnPercentages());
        existing.setUnit(dto.getUnit());
        existing.setReferenceFramework(dto.getReferenceFramework());
        existing.setActive(dto.isActive());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(dto.getUpdatedBy());
        repository.save(existing);
        audit("UPDATE", existing.getId(), dto.getUpdatedBy());
    }

    @Override
    public List<ThresholdDTO> getAll(Long companyId) {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ThresholdDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Threshold not found: " + id)));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
        audit("DELETE", id, null);
    }

    private void audit(String action, Long entityId, Long userId) {
        auditLogRepository.save(DosimetryAuditLog.builder()
                .action(action).entityType("Threshold").entityId(entityId)
                .userId(userId != null ? userId : 0L).timestamp(LocalDateTime.now()).build());
    }

    private Threshold toEntity(ThresholdDTO dto) {
        Threshold e = new Threshold();
        e.setId(dto.getId());
        e.setMineId(dto.getMineId());
        e.setGrandeur(dto.getGrandeur());
        e.setPersonCategory(dto.getPersonCategory());
        e.setDoseConstraint(dto.getDoseConstraint());
        e.setInvestigationLevel(dto.getInvestigationLevel());
        e.setActionLevel(dto.getActionLevel());
        e.setRegulatoryLimit(dto.getRegulatoryLimit());
        e.setWarnPercentages(dto.getWarnPercentages());
        e.setUnit(dto.getUnit());
        e.setReferenceFramework(dto.getReferenceFramework());
        e.setActive(dto.isActive());
        e.setCreatedBy(dto.getCreatedBy());
        e.setUpdatedBy(dto.getUpdatedBy());
        return e;
    }

    private ThresholdDTO toDTO(Threshold e) {
        return new ThresholdDTO(e.getId(), e.getMineId(), e.getGrandeur(),
                e.getPersonCategory(), e.getDoseConstraint(), e.getInvestigationLevel(),
                e.getActionLevel(), e.getRegulatoryLimit(), e.getWarnPercentages(),
                e.getUnit(), e.getReferenceFramework(), e.isActive(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }
}
