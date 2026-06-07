package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.ExposureProfileLinkDTO;
import com.minexpert.hns.dosimetry.entity.AmbientMeasurement;
import com.minexpert.hns.dosimetry.entity.ExposureProfileLink;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.ExposureProfileLinkRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation du service {@link ExposureProfileLinkService}.
 *
 * <p>Les liens sont remplaces "all-or-nothing" via {@link #setLinks} : on supprime tous les
 * liens existants du profil puis on reinsere la liste fournie. La validation de la somme des
 * fractions (&lt;= 1.0) est faite avant ecriture.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ExposureProfileLinkServiceImpl implements ExposureProfileLinkService {

    private static final int SCALE = 4;

    private final ExposureProfileLinkRepository repository;
    private final MeasurementPointRepository pointRepository;
    private final AmbientMeasurementRepository measurementRepository;
    private final DosimetryAuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<ExposureProfileLinkDTO> findByProfile(Long exposureProfileId) {
        return repository.findByExposureProfileId(exposureProfileId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public void setLinks(Long exposureProfileId, List<ExposureProfileLinkDTO> links, Long userId) {
        List<ExposureProfileLinkDTO> incoming = links != null ? links : new ArrayList<>();
        BigDecimal totalFraction = BigDecimal.ZERO;
        for (ExposureProfileLinkDTO link : incoming) {
            if (link.getFraction() == null) {
                throw new IllegalArgumentException("fraction is required for each link");
            }
            if (link.getFraction().signum() < 0
                    || link.getFraction().compareTo(BigDecimal.ONE) > 0) {
                throw new IllegalArgumentException("fraction must be in [0,1]");
            }
            totalFraction = totalFraction.add(link.getFraction());
        }
        if (totalFraction.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException(
                    "Sum of fractions must be <= 1.0, got " + totalFraction);
        }

        repository.deleteByExposureProfileId(exposureProfileId);
        repository.flush();
        LocalDateTime now = LocalDateTime.now();
        for (ExposureProfileLinkDTO link : incoming) {
            MeasurementPoint point = pointRepository.findById(link.getMeasurementPointId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "MeasurementPoint not found: " + link.getMeasurementPointId()));
            BigDecimal estimated = computeAverageRate(point.getId());
            ExposureProfileLink entity = ExposureProfileLink.builder()
                    .exposureProfileId(exposureProfileId)
                    .measurementPointId(point.getId())
                    .fraction(link.getFraction())
                    .estimatedDoseRate(estimated)
                    .lastUpdated(now)
                    .createdAt(now)
                    .createdBy(userId)
                    .build();
            repository.save(entity);
        }
        auditService.log("SET_LINKS", "ExposureProfileLink", exposureProfileId, userId,
                DosimetryRBACConfig.DOSIMETRY_WRITE,
                "profileId=" + exposureProfileId + ";count=" + incoming.size()
                        + ";totalFraction=" + totalFraction);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal computeEstimatedAnnualDose(Long exposureProfileId, int workHoursPerYear) {
        if (workHoursPerYear < 0) {
            throw new IllegalArgumentException("workHoursPerYear must be >= 0");
        }
        List<ExposureProfileLink> links = repository.findByExposureProfileId(exposureProfileId);
        BigDecimal hours = BigDecimal.valueOf(workHoursPerYear);
        BigDecimal total = BigDecimal.ZERO;
        for (ExposureProfileLink link : links) {
            BigDecimal rate = link.getEstimatedDoseRate();
            if (rate == null) {
                rate = computeAverageRate(link.getMeasurementPointId());
            }
            if (rate == null) {
                continue;
            }
            BigDecimal contribution = link.getFraction()
                    .multiply(rate)
                    .multiply(hours);
            total = total.add(contribution);
        }
        return total.setScale(SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Moyenne des valeurs de {@code AmbientMeasurement} sur le point fourni (toutes mesures).
     * Retourne null si aucune mesure.
     */
    private BigDecimal computeAverageRate(Long pointId) {
        List<AmbientMeasurement> rows = measurementRepository
                .findByMeasurementPointIdOrderByMeasuredAtDesc(pointId);
        if (rows.isEmpty()) {
            return null;
        }
        BigDecimal sum = BigDecimal.ZERO;
        int n = 0;
        for (AmbientMeasurement m : rows) {
            if (m.getValue() != null) {
                sum = sum.add(m.getValue());
                n++;
            }
        }
        if (n == 0) {
            return null;
        }
        return sum.divide(BigDecimal.valueOf(n), SCALE, RoundingMode.HALF_UP);
    }

    private ExposureProfileLinkDTO toDTO(ExposureProfileLink e) {
        return ExposureProfileLinkDTO.builder()
                .id(e.getId())
                .exposureProfileId(e.getExposureProfileId())
                .measurementPointId(e.getMeasurementPointId())
                .fraction(e.getFraction())
                .estimatedDoseRate(e.getEstimatedDoseRate())
                .lastUpdated(e.getLastUpdated())
                .createdAt(e.getCreatedAt())
                .createdBy(e.getCreatedBy())
                .build();
    }
}
