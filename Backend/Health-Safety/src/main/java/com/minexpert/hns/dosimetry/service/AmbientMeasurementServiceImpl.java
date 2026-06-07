package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementDTO;
import com.minexpert.hns.dosimetry.dto.AmbientMeasurementStatsDTO;
import com.minexpert.hns.dosimetry.entity.AmbientMeasurement;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service {@link AmbientMeasurementService}.
 *
 * <p><b>APPEND-ONLY :</b> aucune methode de mise a jour ; cf. trigger BDD V007.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AmbientMeasurementServiceImpl implements AmbientMeasurementService {

    private static final int SCALE = 4;

    private final AmbientMeasurementRepository repository;
    private final MeasurementPointRepository pointRepository;
    private final DosimetryAuditService auditService;

    @Override
    public AmbientMeasurementDTO recordMeasurement(AmbientMeasurementDTO dto, Long userId) {
        if (dto.getMeasurementPointId() == null) {
            throw new IllegalArgumentException("measurementPointId is required");
        }
        MeasurementPoint point = pointRepository.findById(dto.getMeasurementPointId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "MeasurementPoint not found: " + dto.getMeasurementPointId()));
        if (!point.isActive()) {
            throw new IllegalStateException("MeasurementPoint is inactive: " + point.getId());
        }
        if (dto.getMineId() != null && !point.getMineId().equals(dto.getMineId())) {
            throw new IllegalArgumentException(
                    "mineId mismatch between measurement and measurement point");
        }
        // Resolution createdBy / measuredBy :
        //   1. priorite au userId du header X-User-Id (source d'authentification)
        //   2. fallback sur dto.measuredBy si pas de header (compat retro / job interne)
        Long effectiveActorId = userId != null ? userId : dto.getMeasuredBy();
        Long effectiveMeasuredBy = dto.getMeasuredBy() != null ? dto.getMeasuredBy() : userId;
        LocalDateTime now = LocalDateTime.now();
        AmbientMeasurement entity = AmbientMeasurement.builder()
                .mineId(point.getMineId())
                .measurementPointId(point.getId())
                .measuredAt(dto.getMeasuredAt() != null ? dto.getMeasuredAt() : now)
                .measuredBy(effectiveMeasuredBy)
                .value(dto.getValue())
                .uncertainty(dto.getUncertainty())
                .instrumentId(dto.getInstrumentId())
                .instrumentSerial(dto.getInstrumentSerial())
                .context(dto.getContext())
                .campaignId(dto.getCampaignId())
                .notes(dto.getNotes())
                .createdAt(now)
                .createdBy(effectiveActorId)
                .build();
        AmbientMeasurement saved = repository.save(entity);

        BigDecimal trend = computeTrendVsPrevious(point.getId(), saved.getId(), saved.getValue());
        boolean above = isAboveReference(point.getReferenceLevel(), saved.getValue());

        auditService.log("CREATE", "AmbientMeasurement", saved.getId(), effectiveActorId,
                DosimetryRBACConfig.DOSIMETRY_WRITE,
                "pointId=" + point.getId() + ";value=" + saved.getValue()
                        + ";aboveRef=" + above + ";trend=" + trend);

        AmbientMeasurementDTO result = toDTO(saved);
        result.setAboveReferenceLevel(above);
        result.setTrendVsPrevious(trend);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmbientMeasurementDTO> findByPoint(Long pointId, LocalDateTime from,
            LocalDateTime to) {
        List<AmbientMeasurement> rows;
        if (from != null && to != null) {
            rows = repository.findByPointAndRange(pointId, from, to);
        } else {
            rows = repository.findByMeasurementPointIdOrderByMeasuredAtDesc(pointId);
        }
        return rows.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmbientMeasurementDTO> findByCampaign(Long campaignId) {
        return repository.findByCampaignIdOrderByMeasuredAtDesc(campaignId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AmbientMeasurementStatsDTO getStatsByPoint(Long pointId, LocalDateTime from,
            LocalDateTime to) {
        MeasurementPoint point = pointRepository.findById(pointId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MeasurementPoint not found: " + pointId));
        LocalDateTime effFrom = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime effTo = to != null ? to : LocalDateTime.now().plusDays(1);
        List<AmbientMeasurement> rows = repository.findByPointAndRange(pointId, effFrom, effTo);
        long count = rows.size();
        BigDecimal min = null;
        BigDecimal max = null;
        BigDecimal sum = BigDecimal.ZERO;
        long overRef = 0;
        BigDecimal refLevel = point.getReferenceLevel();
        for (AmbientMeasurement r : rows) {
            BigDecimal v = r.getValue();
            if (v == null) {
                continue;
            }
            if (min == null || v.compareTo(min) < 0) {
                min = v;
            }
            if (max == null || v.compareTo(max) > 0) {
                max = v;
            }
            sum = sum.add(v);
            if (refLevel != null && v.compareTo(refLevel) > 0) {
                overRef++;
            }
        }
        BigDecimal avg = count > 0
                ? sum.divide(BigDecimal.valueOf(count), SCALE, RoundingMode.HALF_UP)
                : null;
        BigDecimal median = computeMedian(rows);
        return AmbientMeasurementStatsDTO.builder()
                .measurementPointId(pointId)
                .from(from)
                .to(to)
                .count(count)
                .min(min)
                .max(max)
                .avg(avg)
                .median(median)
                .referenceLevel(refLevel)
                .overReferenceCount(overRef)
                .build();
    }

    // ------- Helpers ------------------------------------------------------------

    /**
     * Calcule la variation relative en pourcentage par rapport a la mesure immediatement
     * precedente sur le meme point (hors mesure courante). Retourne null si pas d'antecedent
     * ou si la precedente est nulle/zero.
     */
    private BigDecimal computeTrendVsPrevious(Long pointId, Long currentId, BigDecimal currentValue) {
        if (currentValue == null) {
            return null;
        }
        List<AmbientMeasurement> latest = repository.findLatestByPoint(pointId,
                PageRequest.of(0, 2));
        Optional<AmbientMeasurement> previous = latest.stream()
                .filter(m -> !m.getId().equals(currentId))
                .findFirst();
        if (previous.isEmpty()) {
            return null;
        }
        BigDecimal prev = previous.get().getValue();
        if (prev == null || prev.signum() == 0) {
            return null;
        }
        return currentValue.subtract(prev)
                .multiply(BigDecimal.valueOf(100))
                .divide(prev, SCALE, RoundingMode.HALF_UP);
    }

    private boolean isAboveReference(BigDecimal refLevel, BigDecimal value) {
        return refLevel != null && value != null && value.compareTo(refLevel) > 0;
    }

    private BigDecimal computeMedian(List<AmbientMeasurement> rows) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }
        List<BigDecimal> values = rows.stream()
                .map(AmbientMeasurement::getValue)
                .filter(v -> v != null)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
        if (values.isEmpty()) {
            return null;
        }
        int n = values.size();
        if (n % 2 == 1) {
            return values.get(n / 2).setScale(SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal lower = values.get(n / 2 - 1);
        BigDecimal upper = values.get(n / 2);
        return lower.add(upper).divide(BigDecimal.valueOf(2), SCALE, RoundingMode.HALF_UP);
    }

    private AmbientMeasurementDTO toDTO(AmbientMeasurement e) {
        return AmbientMeasurementDTO.builder()
                .id(e.getId())
                .mineId(e.getMineId())
                .measurementPointId(e.getMeasurementPointId())
                .measuredAt(e.getMeasuredAt())
                .measuredBy(e.getMeasuredBy())
                .value(e.getValue())
                .uncertainty(e.getUncertainty())
                .instrumentId(e.getInstrumentId())
                .instrumentSerial(e.getInstrumentSerial())
                .context(e.getContext())
                .campaignId(e.getCampaignId())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .createdBy(e.getCreatedBy())
                .build();
    }
}
