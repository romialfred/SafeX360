package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.MeasurementPointDTO;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.ZoneClass;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation CRUD du service {@link MeasurementPointService}.
 *
 * <p>Le verrouillage optimiste via {@link MeasurementPoint#getVersion()} est gere directement
 * par JPA (annotation {@code @Version}). Le soft-delete est implemente via le flag
 * {@code active} : les mesures historiques sont preservees (AIEA GSR Part 3).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MeasurementPointServiceImpl implements MeasurementPointService {

    private final MeasurementPointRepository repository;
    private final DosimetryAuditService auditService;

    @Override
    public Long create(MeasurementPointDTO dto, Long userId) {
        if (dto.getMineId() == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (repository.existsByMineIdAndCode(dto.getMineId(), dto.getCode())) {
            throw new IllegalStateException("MeasurementPoint already exists for mine="
                    + dto.getMineId() + " code=" + dto.getCode());
        }
        LocalDateTime now = LocalDateTime.now();
        MeasurementPoint entity = toEntity(dto);
        entity.setId(null);
        entity.setActive(true);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setCreatedBy(userId);
        entity.setUpdatedBy(userId);
        MeasurementPoint saved = repository.save(entity);
        auditService.log("CREATE", "MeasurementPoint", saved.getId(), userId,
                DosimetryRBACConfig.DOSIMETRY_WRITE,
                "code=" + saved.getCode() + ";zone=" + saved.getZoneClassification());
        return saved.getId();
    }

    @Override
    public void update(Long id, MeasurementPointDTO dto, Long userId) {
        MeasurementPoint existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MeasurementPoint not found: " + id));
        // Code change check : doit rester unique par mine.
        if (!existing.getCode().equals(dto.getCode())
                && repository.existsByMineIdAndCode(existing.getMineId(), dto.getCode())) {
            throw new IllegalStateException("MeasurementPoint code already used in mine: "
                    + dto.getCode());
        }
        existing.setCode(dto.getCode());
        existing.setLabel(dto.getLabel());
        existing.setZoneId(dto.getZoneId());
        existing.setDescription(dto.getDescription());
        existing.setLocation(dto.getLocation());
        existing.setLatitude(dto.getLatitude());
        existing.setLongitude(dto.getLongitude());
        existing.setElevation(dto.getElevation());
        existing.setZoneClassification(dto.getZoneClassification());
        existing.setReferenceLevel(dto.getReferenceLevel());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        repository.save(existing);
        auditService.log("UPDATE", "MeasurementPoint", existing.getId(), userId,
                DosimetryRBACConfig.DOSIMETRY_WRITE, "code=" + existing.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public MeasurementPointDTO getById(Long id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MeasurementPoint not found: " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeasurementPointDTO> listByMine(Long mineId) {
        return repository.findByMineId(mineId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeasurementPointDTO> listByZone(Long mineId, ZoneClass zoneClassification) {
        return repository.findByMineIdAndZoneClassification(mineId, zoneClassification).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public void activate(Long id, Long userId) {
        setActive(id, true, userId);
    }

    @Override
    public void deactivate(Long id, Long userId) {
        setActive(id, false, userId);
    }

    private void setActive(Long id, boolean active, Long userId) {
        MeasurementPoint existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MeasurementPoint not found: " + id));
        if (existing.isActive() == active) {
            return; // idempotent
        }
        existing.setActive(active);
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        repository.save(existing);
        auditService.log(active ? "ACTIVATE" : "DEACTIVATE", "MeasurementPoint", id, userId,
                DosimetryRBACConfig.DOSIMETRY_WRITE, "active=" + active);
    }

    // ------- Mapping ------------------------------------------------------------

    private MeasurementPoint toEntity(MeasurementPointDTO dto) {
        return MeasurementPoint.builder()
                .id(dto.getId())
                .mineId(dto.getMineId())
                .code(dto.getCode())
                .label(dto.getLabel())
                .zoneId(dto.getZoneId())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .elevation(dto.getElevation())
                .zoneClassification(dto.getZoneClassification())
                .referenceLevel(dto.getReferenceLevel())
                .active(dto.isActive())
                .build();
    }

    private MeasurementPointDTO toDTO(MeasurementPoint e) {
        return MeasurementPointDTO.builder()
                .id(e.getId())
                .mineId(e.getMineId())
                .code(e.getCode())
                .label(e.getLabel())
                .zoneId(e.getZoneId())
                .description(e.getDescription())
                .location(e.getLocation())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .elevation(e.getElevation())
                .zoneClassification(e.getZoneClassification())
                .referenceLevel(e.getReferenceLevel())
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .version(e.getVersion())
                .build();
    }
}
