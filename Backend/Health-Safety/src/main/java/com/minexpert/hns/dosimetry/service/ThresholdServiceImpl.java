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
        requireCompany(companyId);
        validateThresholdSemantics(dto);
        Threshold e = toEntity(dto);
        // La mine vient exclusivement du perimetre authentifie, jamais du payload client.
        e.setMineId(companyId);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        Threshold saved = repository.save(e);
        audit("CREATE", saved.getId(), dto.getCreatedBy());
        return saved.getId();
    }

    @Override
    public void update(Long companyId, ThresholdDTO dto) {
        requireCompany(companyId);
        validateThresholdSemantics(dto);
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Threshold id is required");
        }
        Threshold existing = repository.findByIdAndMineId(dto.getId(), companyId)
                .orElseThrow(() -> new EntityNotFoundException("Threshold not found: " + dto.getId()));
        // Ne jamais permettre un transfert de tenant par modification du corps.
        existing.setMineId(companyId);
        existing.setGrandeur(dto.getGrandeur());
        existing.setPersonCategory(dto.getPersonCategory());
        existing.setDoseConstraint(dto.getDoseConstraint());
        existing.setInvestigationLevel(dto.getInvestigationLevel());
        existing.setActionLevel(dto.getActionLevel());
        existing.setClassificationThreshold(dto.getClassificationThreshold());
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
        requireCompany(companyId);
        return repository.findByMineId(companyId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ThresholdDTO> getGlobalDefaults() {
        return repository.findByMineIdIsNull().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public ThresholdDTO getById(Long companyId, Long id) {
        requireCompany(companyId);
        return toDTO(repository.findByIdAndMineId(id, companyId)
                .orElseThrow(() -> new EntityNotFoundException("Threshold not found: " + id)));
    }

    @Override
    public void delete(Long companyId, Long id) {
        requireCompany(companyId);
        Threshold existing = repository.findByIdAndMineId(id, companyId)
                .orElseThrow(() -> new EntityNotFoundException("Threshold not found: " + id));
        repository.delete(existing);
        audit("DELETE", id, null);
    }

    private void requireCompany(Long companyId) {
        if (companyId == null || companyId <= 0L) {
            throw new IllegalArgumentException("Company scope is required");
        }
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
        e.setClassificationThreshold(dto.getClassificationThreshold());
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
                e.getActionLevel(), e.getClassificationThreshold(), e.getRegulatoryLimit(),
                e.getWarnPercentages(),
                e.getUnit(), e.getReferenceFramework(), e.isActive(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getCreatedBy(), e.getUpdatedBy());
    }

    /**
     * Interdit de requalifier silencieusement le seuil de classification WORKER_B de 6 mSv
     * en limite reglementaire. Une autre limite peut etre configuree uniquement apres
     * validation locale et reste distincte de {@code classificationThreshold}.
     */
    private void validateThresholdSemantics(ThresholdDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Threshold payload is required");
        }
        Double regulatoryLimit = dto.getRegulatoryLimit();
        if ("WORKER_B".equalsIgnoreCase(dto.getPersonCategory())
                && regulatoryLimit != null
                && Math.abs(regulatoryLimit - 6.0d) < 0.000001d) {
            throw new IllegalArgumentException(
                    "WORKER_B: 6 mSv is a classification threshold, not a regulatory limit");
        }
    }
}
