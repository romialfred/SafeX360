package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.DosimetryDistributionDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryGlobalStatusDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryKpiSnapshotDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryMineComparisonDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTopExposedDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTrendPointDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DosimetryKpiSnapshot;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.entity.MeasurementPoint;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.CaseStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.repository.AmbientMeasurementRepository;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryKpiSnapshotRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;
import com.minexpert.hns.dosimetry.repository.MeasurementPointRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation du service {@link DosimetryAggregationService} (Phase 8).
 *
 * <p>L'algo materialise le KPI agreget en N+1 etapes contrlees plutot que par jointures
 * couteuses sur de grosses tables. Les snapshots sont upsertes par couple
 * {@code (mineId, snapshotDate, category)} en append-only logique : le scheduler journalier
 * recrache un snapshot du jour ; si la combinaison existe deja, on la supprime puis re-insere
 * (fail-safe contre une re-execution intra-day).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class DosimetryAggregationServiceImpl implements DosimetryAggregationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DosimetryAggregationServiceImpl.class);

    /** Echelle BigDecimal pour les doses (mSv). */
    private static final int SCALE = 4;
    /** Fenetre d'expiration des fiches d'aptitude (jours). */
    private static final int FITNESS_EXPIRY_WINDOW_DAYS = 60;

    private final DosimetryKpiSnapshotRepository snapshotRepository;
    private final ExposedWorkerRepository workerRepository;
    private final DoseCumulativeRepository cumulativeRepository;
    private final DoseRecordRepository doseRecordRepository;
    private final ExposureAlertRepository alertRepository;
    private final OverexposureCaseRepository caseRepository;
    private final FitnessAssessmentRepository fitnessRepository;
    private final MeasurementPointRepository measurementPointRepository;
    private final AmbientMeasurementRepository ambientRepository;
    private final RegulatoryLimitResolver regulatoryLimitResolver;
    /**
     * Enrichissement RH (nom / matricule du worker dans le top exposés). Best-effort,
     * peut être null si la table {@code employee} n'est pas accessible.
     */
    private final EmployeeLookupService employeeLookupService;

    // ============================================================
    //  computeKpisForMine
    // ============================================================

    @Override
    public int computeKpisForMine(Long mineId, LocalDate date) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (date == null) {
            throw new IllegalArgumentException("date is required");
        }

        int year = date.getYear();
        List<ExposedWorker> activeWorkers = workerRepository.findByMineIdAndActiveTrue(mineId);

        Map<KpiCategory, List<ExposedWorker>> byCategory = groupByKpiCategory(activeWorkers);

        List<Long> activeWorkerIds = activeWorkers.stream()
                .map(ExposedWorker::getId).collect(Collectors.toList());
        Map<Long, DoseCumulative> cumulativesByWorker = activeWorkerIds.isEmpty() ? new HashMap<>()
                : cumulativeRepository.findByWorkerIdInAndYear(activeWorkerIds, year).stream()
                        .collect(Collectors.toMap(DoseCumulative::getWorkerId, c -> c, (a, b) -> a));

        // Alerts ACTIVE (par mine, toutes categories puis ventilees) :
        List<ExposureAlert> activeAlerts = alertRepository.findByMineIdAndStatus(mineId, AlertStatus.ACTIVE);
        Map<Long, ExposedWorker> workerById = activeWorkers.stream()
                .collect(Collectors.toMap(ExposedWorker::getId, w -> w, (a, b) -> a));
        Map<KpiCategory, Long> alertsByCategory = new EnumMap<>(KpiCategory.class);
        for (ExposureAlert a : activeAlerts) {
            ExposedWorker w = workerById.get(a.getWorkerId());
            if (w == null) {
                continue;
            }
            KpiCategory kc = mapToKpiCategory(w);
            alertsByCategory.merge(kc, 1L, Long::sum);
        }

        // Overexposure OPEN/INVESTIGATING par categorie :
        List<com.minexpert.hns.dosimetry.entity.OverexposureCase> openCases = caseRepository
                .findActiveByMineId(mineId, List.of(CaseStatus.OPEN, CaseStatus.INVESTIGATING));
        Map<KpiCategory, Long> casesByCategory = new EnumMap<>(KpiCategory.class);
        for (com.minexpert.hns.dosimetry.entity.OverexposureCase c : openCases) {
            ExposedWorker w = c.getWorker();
            if (w == null) {
                continue;
            }
            KpiCategory kc = mapToKpiCategory(w);
            casesByCategory.merge(kc, 1L, Long::sum);
        }

        // Fitness expiring soon (mine-wide, repartis par categorie) :
        Map<KpiCategory, Long> fitnessExpiringByCategory = computeFitnessExpiringByCategory(
                mineId, activeWorkers, date);

        // Ambient avg uSv/h sur la mine (toutes categories) :
        BigDecimal ambientAvg = computeAmbientAvg(mineId, date);
        long measurementPointsCount = measurementPointRepository.countByMineIdAndActive(mineId, true);

        int upserted = 0;
        LocalDateTime now = LocalDateTime.now();
        for (KpiCategory cat : KpiCategory.values()) {
            List<ExposedWorker> categoryWorkers = byCategory.getOrDefault(cat, List.of());
            Double regulatoryLimit = regulatoryLimitResolver.resolveAnnualHp10(mineId, cat)
                    .orElse(null);
            DosimetryKpiSnapshot snap = computeOneSnapshot(mineId, date, year, cat,
                    categoryWorkers, cumulativesByWorker,
                    alertsByCategory.getOrDefault(cat, 0L),
                    casesByCategory.getOrDefault(cat, 0L),
                    fitnessExpiringByCategory.getOrDefault(cat, 0L),
                    measurementPointsCount, ambientAvg, now, regulatoryLimit);

            try {
                Optional<DosimetryKpiSnapshot> existing = snapshotRepository
                        .findByMineIdAndSnapshotDateAndCategory(mineId, date, cat);
                existing.ifPresent(e -> {
                    snapshotRepository.delete(e);
                    snapshotRepository.flush();
                });
                snapshotRepository.save(snap);
                upserted++;
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                LOGGER.warn("[DosimetryAggregation] Concurrent upsert for mineId={} date={} cat={}, retrying.",
                        mineId, date, cat);
                snapshotRepository.findByMineIdAndSnapshotDateAndCategory(mineId, date, cat)
                        .ifPresent(snapshotRepository::delete);
                snapshotRepository.flush();
                snapshotRepository.save(snap);
                upserted++;
            }
        }
        LOGGER.info("[DosimetryAggregation] mineId={} date={} : {} snapshots upserted.",
                mineId, date, upserted);
        return upserted;
    }

    private DosimetryKpiSnapshot computeOneSnapshot(Long mineId, LocalDate date, int year,
            KpiCategory cat, List<ExposedWorker> categoryWorkers,
            Map<Long, DoseCumulative> cumulativesByWorker,
            long activeAlertsCount, long overexposureCasesOpen, long fitnessExpiringSoon,
            long measurementPointsCount, BigDecimal ambientAvg, LocalDateTime now,
            Double regulatoryLimit) {

        long workersCount = categoryWorkers.size();
        List<Double> annualDoses = new ArrayList<>();
        for (ExposedWorker w : categoryWorkers) {
            DoseCumulative dc = cumulativesByWorker.get(w.getId());
            if (dc != null && dc.getAnnualHp10() != null) {
                annualDoses.add(dc.getAnnualHp10());
            }
        }
        List<Long> workerIds = categoryWorkers.stream()
                .map(ExposedWorker::getId).collect(Collectors.toList());
        long doseRecordsCount = workerIds.isEmpty() ? 0L
                : doseRecordRepository.countActiveByWorkerIdsAndYear(workerIds, String.valueOf(year));

        BigDecimal avg = average(annualDoses);
        BigDecimal median = median(annualDoses);
        BigDecimal max = max(annualDoses);

        long over50 = countOver(annualDoses, regulatoryLimit, 0.50);
        long over75 = countOver(annualDoses, regulatoryLimit, 0.75);
        long over90 = countOver(annualDoses, regulatoryLimit, 0.90);
        long over100 = countOver(annualDoses, regulatoryLimit, 1.00);

        return DosimetryKpiSnapshot.builder()
                .mineId(mineId)
                .snapshotDate(date)
                .category(cat)
                .workersCount(workersCount)
                .doseRecordsCount(doseRecordsCount)
                .avgAnnualDose(avg)
                .medianAnnualDose(median)
                .maxAnnualDose(max)
                .workersOver50Pct(over50)
                .workersOver75Pct(over75)
                .workersOver90Pct(over90)
                .workersOver100Pct(over100)
                .activeAlertsCount(activeAlertsCount)
                .overexposureCasesOpen(overexposureCasesOpen)
                .fitnessExpiringSoon(fitnessExpiringSoon)
                .measurementPointsCount(measurementPointsCount)
                .ambientAvgUsvh(ambientAvg)
                .createdAt(now)
                .build();
    }

    // ============================================================
    //  getKpis
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<DosimetryKpiSnapshotDTO> getKpis(Long mineId, LocalDate fromDate, LocalDate toDate,
            KpiCategory category) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().minusMonths(12);
        LocalDate to = toDate != null ? toDate : LocalDate.now();
        List<DosimetryKpiSnapshot> rows;
        if (category != null) {
            rows = snapshotRepository
                    .findByMineIdAndCategoryAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                            mineId, category, from, to);
        } else {
            rows = snapshotRepository
                    .findByMineIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(mineId, from, to);
        }
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ============================================================
    //  getTopExposedWorkers
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<DosimetryTopExposedDTO> getTopExposedWorkers(Long mineId, int limit, int year) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (limit <= 0) {
            limit = 10;
        }
        List<ExposedWorker> workers = workerRepository.findByMineIdAndActiveTrue(mineId);
        List<Long> allWorkerIds = workers.stream().map(ExposedWorker::getId).collect(Collectors.toList());
        Map<Long, DoseCumulative> cumulByWorker = allWorkerIds.isEmpty() ? Map.of()
                : cumulativeRepository.findByWorkerIdInAndYear(allWorkerIds, year).stream()
                        .collect(Collectors.toMap(DoseCumulative::getWorkerId, c -> c, (a, b) -> a));
        List<DosimetryTopExposedDTO> out = new ArrayList<>();
        for (ExposedWorker w : workers) {
            DoseCumulative dc = cumulByWorker.get(w.getId());
            if (dc == null || dc.getAnnualHp10() == null) {
                continue;
            }
            KpiCategory kc = mapToKpiCategory(w);
            Double regulatoryLimit = regulatoryLimitResolver.resolveAnnualHp10(w.getMineId(), kc)
                    .orElse(null);
            BigDecimal annual = BigDecimal.valueOf(dc.getAnnualHp10()).setScale(SCALE, RoundingMode.HALF_UP);
            BigDecimal pct = null;
            if (regulatoryLimit != null && regulatoryLimit > 0d) {
                pct = annual.multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(regulatoryLimit), 2, RoundingMode.HALF_UP);
            }
            out.add(DosimetryTopExposedDTO.builder()
                    .workerId(w.getId())
                    .employeeId(w.getEmployeeId())
                    .category(kc)
                    .annualDose(annual)
                    .percentOfLimit(pct)
                    .build());
        }
        out.sort(Comparator.comparing(DosimetryTopExposedDTO::getAnnualDose,
                Comparator.nullsLast(Comparator.reverseOrder())));
        List<DosimetryTopExposedDTO> limited = out.stream().limit(limit).collect(Collectors.toList());
        for (int i = 0; i < limited.size(); i++) {
            limited.get(i).setRank(i + 1);
        }

        // Enrichissement RH batch sur le top final uniquement (évite de pinguer la table
        // employee pour des workers qui n'apparaîtront pas dans le top).
        if (employeeLookupService != null && !limited.isEmpty()) {
            List<Long> employeeIds = limited.stream()
                    .map(DosimetryTopExposedDTO::getEmployeeId)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            Map<Long, EmployeeLookupService.EmployeeInfo> rh =
                    employeeLookupService.resolveBatch(employeeIds);
            for (DosimetryTopExposedDTO dto : limited) {
                EmployeeLookupService.EmployeeInfo info = rh.get(dto.getEmployeeId());
                if (info != null) {
                    dto.setWorkerName(info.fullName());
                    dto.setMatricule(info.matricule());
                }
            }
        }
        return limited;
    }

    // ============================================================
    //  getDistribution
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public DosimetryDistributionDTO getDistribution(Long mineId, int year, KpiCategory category) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        List<ExposedWorker> workers = workerRepository.findByMineIdAndActiveTrue(mineId);
        if (category != null) {
            workers = workers.stream()
                    .filter(w -> mapToKpiCategory(w) == category)
                    .collect(Collectors.toList());
        }
        Double regulatoryLimit = category != null
                ? regulatoryLimitResolver.resolveAnnualHp10(mineId, category).orElse(null)
                : null;
        if (regulatoryLimit == null || regulatoryLimit <= 0d) {
            return DosimetryDistributionDTO.builder()
                    .mineId(mineId)
                    .year(year)
                    .category(category)
                    .regulatoryLimit(null)
                    .regulatoryLimitConfigured(false)
                    .regulatoryLimitStatus(category == null
                            ? "CATEGORY_REQUIRED"
                            : "NOT_CONFIGURED_LOCAL_VALIDATION_REQUIRED")
                    .workersCount(workers.size())
                    .buckets(List.of())
                    .build();
        }
        List<Long> distWorkerIds = workers.stream().map(ExposedWorker::getId).collect(Collectors.toList());
        Map<Long, DoseCumulative> distCumul = distWorkerIds.isEmpty() ? Map.of()
                : cumulativeRepository.findByWorkerIdInAndYear(distWorkerIds, year).stream()
                        .collect(Collectors.toMap(DoseCumulative::getWorkerId, c -> c, (a, b) -> a));

        long b0 = 0;
        long b25 = 0;
        long b50 = 0;
        long b75 = 0;
        long b90 = 0;
        long b100 = 0;
        long total = 0;
        for (ExposedWorker w : workers) {
            DoseCumulative dc = distCumul.get(w.getId());
            double dose = dc != null && dc.getAnnualHp10() != null ? dc.getAnnualHp10() : 0d;
            double pct = (dose / regulatoryLimit) * 100d;
            total++;
            if (pct <= 25d) {
                b0++;
            } else if (pct <= 50d) {
                b25++;
            } else if (pct <= 75d) {
                b50++;
            } else if (pct <= 90d) {
                b75++;
            } else if (pct <= 100d) {
                b90++;
            } else {
                b100++;
            }
        }

        List<DosimetryDistributionDTO.Bucket> buckets = List.of(
                bucket(0d, 25d, "0-25%", b0),
                bucket(25d, 50d, "25-50%", b25),
                bucket(50d, 75d, "50-75%", b50),
                bucket(75d, 90d, "75-90%", b75),
                bucket(90d, 100d, "90-100%", b90),
                bucket(100d, Double.POSITIVE_INFINITY, "100%+", b100));

        return DosimetryDistributionDTO.builder()
                .mineId(mineId)
                .year(year)
                .category(category)
                .regulatoryLimit(regulatoryLimit)
                .regulatoryLimitConfigured(true)
                .regulatoryLimitStatus("CONFIGURED")
                .workersCount(total)
                .buckets(buckets)
                .build();
    }

    private DosimetryDistributionDTO.Bucket bucket(double from, double to, String label, long count) {
        return DosimetryDistributionDTO.Bucket.builder()
                .fromPct(from).toPct(to).label(label).count(count).build();
    }

    // ============================================================
    //  getTrend
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<DosimetryTrendPointDTO> getTrend(Long mineId, int months, KpiCategory category,
            String metric) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (months <= 0 || months > 36) {
            months = 12;
        }
        String metricKey = metric != null && !metric.isBlank() ? metric : "avgAnnualDose";

        LocalDate today = LocalDate.now();
        YearMonth start = YearMonth.from(today).minusMonths((long) months - 1);

        List<DosimetryTrendPointDTO> points = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            YearMonth ym = start.plusMonths(i);
            LocalDate monthStart = ym.atDay(1);
            LocalDate monthEnd = ym.atEndOfMonth();

            List<DosimetryKpiSnapshot> rows;
            if (category != null) {
                rows = snapshotRepository
                        .findByMineIdAndCategoryAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                                mineId, category, monthStart, monthEnd);
            } else {
                rows = snapshotRepository
                        .findByMineIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                                mineId, monthStart, monthEnd);
            }
            BigDecimal value = null;
            LocalDate snapDate = null;
            if (!rows.isEmpty()) {
                // dernier snapshot du mois (copie defensive : la liste peut etre immuable)
                List<DosimetryKpiSnapshot> sorted = new ArrayList<>(rows);
                sorted.sort(Comparator.comparing(DosimetryKpiSnapshot::getSnapshotDate));
                DosimetryKpiSnapshot last = sorted.get(sorted.size() - 1);
                snapDate = last.getSnapshotDate();
                // agregat de toutes les categories du mois
                if (category != null) {
                    value = extractMetric(last, metricKey);
                } else {
                    List<DosimetryKpiSnapshot> latestOfMonth = sorted.stream()
                            .filter(r -> r.getSnapshotDate().equals(last.getSnapshotDate()))
                            .collect(Collectors.toList());
                    value = aggregateMetric(latestOfMonth, metricKey);
                }
            }
            points.add(DosimetryTrendPointDTO.builder()
                    .period(ym.toString())
                    .snapshotDate(snapDate)
                    .metric(metricKey)
                    .value(value)
                    .build());
        }
        return points;
    }

    // ============================================================
    //  getMultiMineComparison
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<DosimetryMineComparisonDTO> getMultiMineComparison(LocalDate date) {
        LocalDate effective = date != null ? date
                : snapshotRepository.findLatestSnapshotDateGlobal().orElse(LocalDate.now());
        List<DosimetryKpiSnapshot> rows = snapshotRepository
                .findBySnapshotDateOrderByMineIdAscCategoryAsc(effective);
        Map<Long, List<DosimetryKpiSnapshot>> byMine = rows.stream()
                .collect(Collectors.groupingBy(DosimetryKpiSnapshot::getMineId, LinkedHashMap::new,
                        Collectors.toList()));
        List<DosimetryMineComparisonDTO> out = new ArrayList<>();
        for (Map.Entry<Long, List<DosimetryKpiSnapshot>> e : byMine.entrySet()) {
            List<DosimetryKpiSnapshot> snaps = e.getValue();
            long workers = snaps.stream().mapToLong(DosimetryKpiSnapshot::getWorkersCount).sum();
            BigDecimal avg = weightedAvgAnnualDose(snaps);
            BigDecimal maxV = snaps.stream()
                    .map(DosimetryKpiSnapshot::getMaxAnnualDose)
                    .filter(java.util.Objects::nonNull)
                    .max(BigDecimal::compareTo)
                    .orElse(null);
            long over100 = snaps.stream().mapToLong(DosimetryKpiSnapshot::getWorkersOver100Pct).sum();
            // active alerts / cases : on prend le MAX (deja un agregat mine-wide repete par categorie)
            long alerts = snaps.stream().mapToLong(DosimetryKpiSnapshot::getActiveAlertsCount).max().orElse(0L);
            long cases = snaps.stream().mapToLong(DosimetryKpiSnapshot::getOverexposureCasesOpen).max().orElse(0L);
            BigDecimal ambient = snaps.stream()
                    .map(DosimetryKpiSnapshot::getAmbientAvgUsvh)
                    .filter(java.util.Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            out.add(DosimetryMineComparisonDTO.builder()
                    .mineId(e.getKey())
                    .snapshotDate(effective)
                    .workersCount(workers)
                    .avgAnnualDose(avg)
                    .maxAnnualDose(maxV)
                    .workersOver100Pct(over100)
                    .activeAlertsCount(alerts)
                    .overexposureCasesOpen(cases)
                    .ambientAvgUsvh(ambient)
                    .build());
        }
        return out;
    }

    // ============================================================
    //  getGlobalStatus
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public DosimetryGlobalStatusDTO getGlobalStatus() {
        LocalDate effective = snapshotRepository.findLatestSnapshotDateGlobal().orElse(LocalDate.now());
        List<DosimetryKpiSnapshot> rows = snapshotRepository
                .findBySnapshotDateOrderByMineIdAscCategoryAsc(effective);

        long minesCount = rows.stream().map(DosimetryKpiSnapshot::getMineId).distinct().count();
        long workers = rows.stream().mapToLong(DosimetryKpiSnapshot::getWorkersCount).sum();
        long doseRecords = rows.stream().mapToLong(DosimetryKpiSnapshot::getDoseRecordsCount).sum();
        BigDecimal avg = weightedAvgAnnualDose(rows);
        BigDecimal maxV = rows.stream()
                .map(DosimetryKpiSnapshot::getMaxAnnualDose)
                .filter(java.util.Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null);
        long over50 = rows.stream().mapToLong(DosimetryKpiSnapshot::getWorkersOver50Pct).sum();
        long over75 = rows.stream().mapToLong(DosimetryKpiSnapshot::getWorkersOver75Pct).sum();
        long over90 = rows.stream().mapToLong(DosimetryKpiSnapshot::getWorkersOver90Pct).sum();
        long over100 = rows.stream().mapToLong(DosimetryKpiSnapshot::getWorkersOver100Pct).sum();

        // pour activeAlerts/cases on prend MAX par mine pour eviter double-compte par categorie
        Map<Long, Long> alertsByMine = rows.stream()
                .collect(Collectors.toMap(DosimetryKpiSnapshot::getMineId,
                        DosimetryKpiSnapshot::getActiveAlertsCount, Long::max));
        Map<Long, Long> casesByMine = rows.stream()
                .collect(Collectors.toMap(DosimetryKpiSnapshot::getMineId,
                        DosimetryKpiSnapshot::getOverexposureCasesOpen, Long::max));
        Map<Long, Long> fitnessByMine = rows.stream()
                .collect(Collectors.toMap(DosimetryKpiSnapshot::getMineId,
                        DosimetryKpiSnapshot::getFitnessExpiringSoon, Long::max));
        Map<Long, Long> mpByMine = rows.stream()
                .collect(Collectors.toMap(DosimetryKpiSnapshot::getMineId,
                        DosimetryKpiSnapshot::getMeasurementPointsCount, Long::max));

        long activeAlerts = alertsByMine.values().stream().mapToLong(Long::longValue).sum();
        long openCases = casesByMine.values().stream().mapToLong(Long::longValue).sum();
        long fitnessExpiring = fitnessByMine.values().stream().mapToLong(Long::longValue).sum();
        long measurementPoints = mpByMine.values().stream().mapToLong(Long::longValue).sum();

        // ambient : moyenne arithmetique des valeurs non-null
        List<BigDecimal> ambients = rows.stream()
                .map(DosimetryKpiSnapshot::getAmbientAvgUsvh)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        BigDecimal ambient = null;
        if (!ambients.isEmpty()) {
            BigDecimal sum = ambients.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            ambient = sum.divide(BigDecimal.valueOf(ambients.size()), SCALE, RoundingMode.HALF_UP);
        }

        return DosimetryGlobalStatusDTO.builder()
                .snapshotDate(effective)
                .minesCount(minesCount)
                .workersCount(workers)
                .doseRecordsCount(doseRecords)
                .avgAnnualDose(avg)
                .maxAnnualDose(maxV)
                .workersOver50Pct(over50)
                .workersOver75Pct(over75)
                .workersOver90Pct(over90)
                .workersOver100Pct(over100)
                .activeAlertsCount(activeAlerts)
                .overexposureCasesOpen(openCases)
                .fitnessExpiringSoon(fitnessExpiring)
                .measurementPointsCount(measurementPoints)
                .ambientAvgUsvh(ambient)
                .build();
    }

    // ============================================================
    //  toDto
    // ============================================================

    @Override
    public DosimetryKpiSnapshotDTO toDto(DosimetryKpiSnapshot e) {
        if (e == null) {
            return null;
        }
        return DosimetryKpiSnapshotDTO.builder()
                .id(e.getId())
                .mineId(e.getMineId())
                .snapshotDate(e.getSnapshotDate())
                .category(e.getCategory())
                .workersCount(e.getWorkersCount())
                .doseRecordsCount(e.getDoseRecordsCount())
                .avgAnnualDose(e.getAvgAnnualDose())
                .medianAnnualDose(e.getMedianAnnualDose())
                .maxAnnualDose(e.getMaxAnnualDose())
                .workersOver50Pct(e.getWorkersOver50Pct())
                .workersOver75Pct(e.getWorkersOver75Pct())
                .workersOver90Pct(e.getWorkersOver90Pct())
                .workersOver100Pct(e.getWorkersOver100Pct())
                .activeAlertsCount(e.getActiveAlertsCount())
                .overexposureCasesOpen(e.getOverexposureCasesOpen())
                .fitnessExpiringSoon(e.getFitnessExpiringSoon())
                .measurementPointsCount(e.getMeasurementPointsCount())
                .ambientAvgUsvh(e.getAmbientAvgUsvh())
                .createdAt(e.getCreatedAt())
                .build();
    }

    // ============================================================
    //  Helpers
    // ============================================================

    private Map<KpiCategory, List<ExposedWorker>> groupByKpiCategory(List<ExposedWorker> workers) {
        Map<KpiCategory, List<ExposedWorker>> out = new EnumMap<>(KpiCategory.class);
        for (KpiCategory c : KpiCategory.values()) {
            out.put(c, new ArrayList<>());
        }
        for (ExposedWorker w : workers) {
            out.get(mapToKpiCategory(w)).add(w);
        }
        return out;
    }

    /**
     * Mapping ExposedWorker -&gt; KpiCategory. La priorite est donnee au special status
     * (PREGNANCY puis APPRENTICE) avant la categorie A/B.
     */
    static KpiCategory mapToKpiCategory(ExposedWorker w) {
        DoseSpecialStatus ss = w.getSpecialStatus();
        if (ss == DoseSpecialStatus.PREGNANCY) {
            return KpiCategory.PREGNANCY;
        }
        if (ss == DoseSpecialStatus.APPRENTICE) {
            return KpiCategory.APPRENTICE;
        }
        DoseCategory cat = w.getCategory();
        if (cat == DoseCategory.A) {
            return KpiCategory.WORKER_A;
        }
        if (cat == DoseCategory.B) {
            return KpiCategory.WORKER_B;
        }
        return KpiCategory.PUBLIC;
    }

    private Map<KpiCategory, Long> computeFitnessExpiringByCategory(Long mineId,
            List<ExposedWorker> workers, LocalDate date) {
        Map<KpiCategory, Long> out = new EnumMap<>(KpiCategory.class);
        LocalDate cutoff = date.plusDays(FITNESS_EXPIRY_WINDOW_DAYS);
        var expiring = fitnessRepository.findExpiringBetween(date, cutoff);
        Map<Long, ExposedWorker> byWorker = workers.stream()
                .collect(Collectors.toMap(ExposedWorker::getId, w -> w, (a, b) -> a));
        for (var f : expiring) {
            ExposedWorker w = byWorker.get(f.getWorkerId());
            if (w == null) {
                continue;
            }
            out.merge(mapToKpiCategory(w), 1L, Long::sum);
        }
        return out;
    }

    private BigDecimal computeAmbientAvg(Long mineId, LocalDate date) {
        LocalDateTime from = date.minusDays(30).atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        BigDecimal avg = ambientRepository.avgValueByMineIdAndRange(mineId, from, to);
        return avg != null ? avg.setScale(SCALE, RoundingMode.HALF_UP) : null;
    }

    private BigDecimal average(List<Double> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO.setScale(SCALE);
        }
        double sum = 0d;
        for (Double v : values) {
            sum += v != null ? v : 0d;
        }
        return BigDecimal.valueOf(sum / values.size()).setScale(SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal median(List<Double> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO.setScale(SCALE);
        }
        List<Double> sorted = new ArrayList<>(values);
        sorted.sort(Comparator.naturalOrder());
        int n = sorted.size();
        double med;
        if (n % 2 == 1) {
            med = sorted.get(n / 2);
        } else {
            med = (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2d;
        }
        return BigDecimal.valueOf(med).setScale(SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal max(List<Double> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO.setScale(SCALE);
        }
        double m = values.stream().mapToDouble(v -> v != null ? v : 0d).max().orElse(0d);
        return BigDecimal.valueOf(m).setScale(SCALE, RoundingMode.HALF_UP);
    }

    private long countOver(List<Double> values, Double limit, double fraction) {
        if (limit == null || limit <= 0d) {
            return 0L;
        }
        double threshold = limit * fraction;
        long c = 0;
        for (Double v : values) {
            if (v != null && v > threshold) {
                c++;
            }
        }
        return c;
    }

    private BigDecimal weightedAvgAnnualDose(List<DosimetryKpiSnapshot> snaps) {
        BigDecimal num = BigDecimal.ZERO;
        long denom = 0L;
        for (DosimetryKpiSnapshot s : snaps) {
            if (s.getAvgAnnualDose() == null || s.getWorkersCount() <= 0) {
                continue;
            }
            num = num.add(s.getAvgAnnualDose().multiply(BigDecimal.valueOf(s.getWorkersCount())));
            denom += s.getWorkersCount();
        }
        if (denom == 0) {
            return null;
        }
        return num.divide(BigDecimal.valueOf(denom), SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal extractMetric(DosimetryKpiSnapshot s, String metric) {
        switch (metric) {
            case "avgAnnualDose":      return s.getAvgAnnualDose();
            case "medianAnnualDose":   return s.getMedianAnnualDose();
            case "maxAnnualDose":      return s.getMaxAnnualDose();
            case "workersCount":       return BigDecimal.valueOf(s.getWorkersCount());
            case "doseRecordsCount":   return BigDecimal.valueOf(s.getDoseRecordsCount());
            case "workersOver50Pct":   return BigDecimal.valueOf(s.getWorkersOver50Pct());
            case "workersOver75Pct":   return BigDecimal.valueOf(s.getWorkersOver75Pct());
            case "workersOver90Pct":   return BigDecimal.valueOf(s.getWorkersOver90Pct());
            case "workersOver100Pct":  return BigDecimal.valueOf(s.getWorkersOver100Pct());
            case "activeAlertsCount":  return BigDecimal.valueOf(s.getActiveAlertsCount());
            case "overexposureCasesOpen": return BigDecimal.valueOf(s.getOverexposureCasesOpen());
            case "fitnessExpiringSoon":   return BigDecimal.valueOf(s.getFitnessExpiringSoon());
            case "measurementPointsCount":return BigDecimal.valueOf(s.getMeasurementPointsCount());
            case "ambientAvgUsvh":     return s.getAmbientAvgUsvh();
            default:                   return s.getAvgAnnualDose();
        }
    }

    /**
     * Agrege une metrique sur plusieurs snapshots (toutes categories d'une meme date).
     * Pour les doses (avg/median) -&gt; moyenne ponderee par workersCount ; pour les
     * compteurs (workersCount, alerts, etc.) -&gt; somme ; pour max -&gt; max.
     */
    private BigDecimal aggregateMetric(List<DosimetryKpiSnapshot> snaps, String metric) {
        if (snaps.isEmpty()) {
            return null;
        }
        switch (metric) {
            case "avgAnnualDose":
            case "medianAnnualDose":
                return weightedAvgAnnualDose(snaps);
            case "maxAnnualDose":
                return snaps.stream()
                        .map(DosimetryKpiSnapshot::getMaxAnnualDose)
                        .filter(java.util.Objects::nonNull)
                        .max(BigDecimal::compareTo)
                        .orElse(null);
            case "activeAlertsCount":
            case "overexposureCasesOpen":
            case "fitnessExpiringSoon":
            case "measurementPointsCount":
                long maxv = snaps.stream()
                        .map(s -> extractMetric(s, metric))
                        .filter(java.util.Objects::nonNull)
                        .mapToLong(BigDecimal::longValue)
                        .max()
                        .orElse(0L);
                return BigDecimal.valueOf(maxv);
            case "ambientAvgUsvh":
                List<BigDecimal> vals = snaps.stream()
                        .map(DosimetryKpiSnapshot::getAmbientAvgUsvh)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
                if (vals.isEmpty()) {
                    return null;
                }
                BigDecimal s2 = vals.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                return s2.divide(BigDecimal.valueOf(vals.size()), SCALE, RoundingMode.HALF_UP);
            default:
                long sum = snaps.stream()
                        .map(s -> extractMetric(s, metric))
                        .filter(java.util.Objects::nonNull)
                        .mapToLong(BigDecimal::longValue)
                        .sum();
                return BigDecimal.valueOf(sum);
        }
    }
}
