package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.minexpert.hns.dosimetry.dto.DosimetryDistributionDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryKpiSnapshotDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryTrendPointDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DosimetryKpiSnapshot;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
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
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

/**
 * Tests unitaires du service d'agregation KPI Dosimetrie (Phase 8).
 *
 * <p>Couvre :
 * <ul>
 *   <li>computeKpisForMine : valeurs coherentes (avg, median, count) sur 3 workers cat A</li>
 *   <li>distribution : la somme des buckets totalise workersCount</li>
 *   <li>trend : retourne le bon nombre de points (== months)</li>
 *   <li>mapping ExposedWorker -&gt; KpiCategory (special status prioritaire)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DosimetryAggregationServiceTest {

    @Mock private DosimetryKpiSnapshotRepository snapshotRepository;
    @Mock private ExposedWorkerRepository workerRepository;
    @Mock private DoseCumulativeRepository cumulativeRepository;
    @Mock private DoseRecordRepository doseRecordRepository;
    @Mock private ExposureAlertRepository alertRepository;
    @Mock private OverexposureCaseRepository caseRepository;
    @Mock private FitnessAssessmentRepository fitnessRepository;
    @Mock private MeasurementPointRepository measurementPointRepository;
    @Mock private AmbientMeasurementRepository ambientRepository;
    @Mock private ThresholdRepository thresholdRepository;
    @Mock private RegulatoryLimitResolver regulatoryLimitResolver;

    @InjectMocks
    private DosimetryAggregationServiceImpl service;

    private ExposedWorker workerA(long id, double annualHp10) {
        return ExposedWorker.builder()
                .id(id).mineId(1L).employeeId(1000L + id)
                .category(DoseCategory.A).active(true).build();
    }

    private DoseCumulative cumulative(Long workerId, int year, double annualHp10) {
        return DoseCumulative.builder()
                .workerId(workerId).year(year).annualHp10(annualHp10).build();
    }

    @BeforeEach
    void resetDefaults() {
        // Defaults that are safe and silent if not overriden.
        when(measurementPointRepository.findByMineIdAndActive(anyLong(), eq(true)))
                .thenReturn(Collections.emptyList());
        when(ambientRepository.findByMineIdAndMeasuredAtBetweenOrderByMeasuredAtDesc(
                anyLong(), any(), any())).thenReturn(Collections.emptyList());
        when(alertRepository.findByMineIdAndStatus(anyLong(), any()))
                .thenReturn(Collections.emptyList());
        when(caseRepository.findActiveByMineId(anyLong(), any()))
                .thenReturn(Collections.emptyList());
        when(fitnessRepository.findExpiringBetween(any(), any()))
                .thenReturn(Collections.emptyList());
        when(doseRecordRepository.findActiveByWorkerIdAndYear(anyLong(), any()))
                .thenReturn(Collections.emptyList());
        when(regulatoryLimitResolver.resolveAnnualHp10(anyLong(), any()))
                .thenReturn(Optional.empty());
    }

    // ------------------------------------------------------------------
    //  computeKpisForMine
    // ------------------------------------------------------------------

    @Test
    @DisplayName("computeKpisForMine : agrege avg / median / max sur 3 workers cat A")
    void computeKpisForMine_consistentValues() {
        Long mineId = 1L;
        LocalDate date = LocalDate.of(2026, 6, 1);

        ExposedWorker w1 = workerA(1, 2.0);
        ExposedWorker w2 = workerA(2, 5.0);
        ExposedWorker w3 = workerA(3, 8.0);

        when(workerRepository.findByMineIdAndActiveTrue(mineId))
                .thenReturn(List.of(w1, w2, w3));
        when(cumulativeRepository.findByWorkerIdInAndYear(any(), eq(2026)))
                .thenReturn(List.of(
                        cumulative(1L, 2026, 2.0),
                        cumulative(2L, 2026, 5.0),
                        cumulative(3L, 2026, 8.0)));
        when(snapshotRepository.findByMineIdAndSnapshotDateAndCategory(anyLong(), any(), any()))
                .thenReturn(Optional.empty());
        when(snapshotRepository.save(any(DosimetryKpiSnapshot.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(regulatoryLimitResolver.resolveAnnualHp10(mineId, KpiCategory.WORKER_A))
                .thenReturn(Optional.of(20.0));

        // Capture snapshots saved per category to validate the WORKER_A one.
        java.util.List<DosimetryKpiSnapshot> saved = new ArrayList<>();
        when(snapshotRepository.save(any(DosimetryKpiSnapshot.class))).thenAnswer(inv -> {
            saved.add(inv.getArgument(0));
            return inv.getArgument(0);
        });

        int upserted = service.computeKpisForMine(mineId, date);

        // 5 categories upsertees (une par valeur de KpiCategory)
        assertThat(upserted).isEqualTo(KpiCategory.values().length);
        DosimetryKpiSnapshot wa = saved.stream()
                .filter(s -> s.getCategory() == KpiCategory.WORKER_A)
                .findFirst().orElseThrow();

        assertThat(wa.getWorkersCount()).isEqualTo(3);
        assertThat(wa.getAvgAnnualDose()).isEqualTo(new BigDecimal("5.0000"));
        assertThat(wa.getMedianAnnualDose()).isEqualTo(new BigDecimal("5.0000"));
        assertThat(wa.getMaxAnnualDose()).isEqualTo(new BigDecimal("8.0000"));
        // limit WORKER_A = 20 mSv => >50% = >10 -> aucun ; >25% = >5 -> 1 (le 8.0)
        // L'implementation utilise 50/75/90/100 % de la limite.
        assertThat(wa.getWorkersOver50Pct()).isZero();
        assertThat(wa.getWorkersOver75Pct()).isZero();
        assertThat(wa.getWorkersOver90Pct()).isZero();
        assertThat(wa.getWorkersOver100Pct()).isZero();
    }

    // ------------------------------------------------------------------
    //  Distribution
    // ------------------------------------------------------------------

    @Test
    @DisplayName("getDistribution : somme des buckets == workersCount")
    void getDistribution_bucketsTotalEqualsWorkersCount() {
        Long mineId = 1L;
        int year = 2026;

        // 5 workers cat A avec des doses repartis sur les buckets
        List<ExposedWorker> workers = List.of(
                workerA(1, 1.0),  // 5% -> b0
                workerA(2, 6.0),  // 30% -> b25
                workerA(3, 11.0), // 55% -> b50
                workerA(4, 17.0), // 85% -> b75
                workerA(5, 22.0)  // 110% -> b100+
        );
        when(workerRepository.findByMineIdAndActiveTrue(mineId)).thenReturn(workers);
        when(cumulativeRepository.findByWorkerIdInAndYear(any(), eq(year)))
                .thenReturn(List.of(
                        cumulative(1L, year, 1.0),
                        cumulative(2L, year, 6.0),
                        cumulative(3L, year, 11.0),
                        cumulative(4L, year, 17.0),
                        cumulative(5L, year, 22.0)));
        when(regulatoryLimitResolver.resolveAnnualHp10(mineId, KpiCategory.WORKER_A))
                .thenReturn(Optional.of(20.0));

        DosimetryDistributionDTO dist = service.getDistribution(mineId, year, KpiCategory.WORKER_A);

        assertThat(dist.getWorkersCount()).isEqualTo(5);
        assertThat(dist.getBuckets()).hasSize(6);
        long sum = dist.getBuckets().stream().mapToLong(DosimetryDistributionDTO.Bucket::getCount).sum();
        assertThat(sum).isEqualTo(dist.getWorkersCount());
        // Et le bucket 100+ doit contenir au moins 1 worker (le 22 mSv / 20 mSv limit)
        assertThat(dist.getBuckets().get(5).getCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("AUD-REG-002 : WORKER_B sans limite configuree n'utilise jamais 6 mSv")
    void getDistribution_workerBWithoutConfiguredLimitDoesNotFallbackToSix() {
        Long mineId = 1L;
        when(workerRepository.findByMineIdAndActiveTrue(mineId)).thenReturn(List.of(
                ExposedWorker.builder().id(9L).mineId(mineId).employeeId(1009L)
                        .category(DoseCategory.B).active(true).build()));
        when(regulatoryLimitResolver.resolveAnnualHp10(mineId, KpiCategory.WORKER_B))
                .thenReturn(Optional.empty());

        DosimetryDistributionDTO dist = service.getDistribution(
                mineId, 2026, KpiCategory.WORKER_B);

        assertThat(dist.getRegulatoryLimit()).isNull();
        assertThat(dist.isRegulatoryLimitConfigured()).isFalse();
        assertThat(dist.getRegulatoryLimitStatus())
                .isEqualTo("NOT_CONFIGURED_LOCAL_VALIDATION_REQUIRED");
        assertThat(dist.getBuckets()).isEmpty();
    }

    @Test
    @DisplayName("AUD-REG-002 : la vue multi-categories n'invente pas une limite commune")
    void getDistribution_allCategoriesRequiresCategoryForRegulatoryComparison() {
        when(workerRepository.findByMineIdAndActiveTrue(1L)).thenReturn(List.of());

        DosimetryDistributionDTO dist = service.getDistribution(1L, 2026, null);

        assertThat(dist.getRegulatoryLimit()).isNull();
        assertThat(dist.isRegulatoryLimitConfigured()).isFalse();
        assertThat(dist.getRegulatoryLimitStatus()).isEqualTo("CATEGORY_REQUIRED");
        assertThat(dist.getBuckets()).isEmpty();
    }

    // ------------------------------------------------------------------
    //  Trend
    // ------------------------------------------------------------------

    @Test
    @DisplayName("getTrend : retourne months points avec period au format YYYY-MM")
    void getTrend_returnsRightNumberOfPoints() {
        Long mineId = 1L;
        int months = 6;

        when(snapshotRepository
                .findByMineIdAndCategoryAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                        anyLong(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(snapshotRepository.findByMineIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                anyLong(), any(), any())).thenReturn(Collections.emptyList());

        List<DosimetryTrendPointDTO> points = service.getTrend(
                mineId, months, KpiCategory.WORKER_A, "avgAnnualDose");

        assertThat(points).hasSize(months);
        for (DosimetryTrendPointDTO p : points) {
            assertThat(p.getPeriod()).matches("\\d{4}-\\d{2}");
            assertThat(p.getMetric()).isEqualTo("avgAnnualDose");
        }
    }

    @Test
    @DisplayName("getTrend : agrege bien les snapshots presents pour le mois courant")
    void getTrend_aggregatesSnapshots() {
        Long mineId = 1L;
        DosimetryKpiSnapshot s = DosimetryKpiSnapshot.builder()
                .id(1L).mineId(mineId).snapshotDate(LocalDate.now())
                .category(KpiCategory.WORKER_A).workersCount(10)
                .avgAnnualDose(new BigDecimal("4.5000"))
                .build();
        when(snapshotRepository
                .findByMineIdAndCategoryAndSnapshotDateBetweenOrderBySnapshotDateAsc(
                        anyLong(), any(), any(), any()))
                .thenReturn(List.of(s));

        List<DosimetryTrendPointDTO> points = service.getTrend(
                mineId, 1, KpiCategory.WORKER_A, "avgAnnualDose");

        assertThat(points).hasSize(1);
        BigDecimal v = points.get(0).getValue();
        assertThat(v).isNotNull();
        assertThat(v.setScale(4, RoundingMode.HALF_UP))
                .isEqualByComparingTo(new BigDecimal("4.5000"));
    }

    // ------------------------------------------------------------------
    //  Mapping ExposedWorker -> KpiCategory
    // ------------------------------------------------------------------

    @Test
    @DisplayName("mapToKpiCategory : PREGNANCY prioritaire sur cat A/B")
    void mapToKpiCategory_pregnancyPriority() {
        ExposedWorker w = ExposedWorker.builder()
                .category(DoseCategory.A)
                .specialStatus(com.minexpert.hns.dosimetry.enums.DoseSpecialStatus.PREGNANCY)
                .build();
        assertThat(DosimetryAggregationServiceImpl.mapToKpiCategory(w))
                .isEqualTo(KpiCategory.PREGNANCY);
    }

    @Test
    @DisplayName("mapToKpiCategory : APPRENTICE prioritaire sur cat A/B")
    void mapToKpiCategory_apprenticePriority() {
        ExposedWorker w = ExposedWorker.builder()
                .category(DoseCategory.B)
                .specialStatus(com.minexpert.hns.dosimetry.enums.DoseSpecialStatus.APPRENTICE)
                .build();
        assertThat(DosimetryAggregationServiceImpl.mapToKpiCategory(w))
                .isEqualTo(KpiCategory.APPRENTICE);
    }

    @Test
    @DisplayName("mapToKpiCategory : cat A -> WORKER_A si pas de special status")
    void mapToKpiCategory_workerA() {
        ExposedWorker w = ExposedWorker.builder()
                .category(DoseCategory.A)
                .specialStatus(com.minexpert.hns.dosimetry.enums.DoseSpecialStatus.NONE)
                .build();
        assertThat(DosimetryAggregationServiceImpl.mapToKpiCategory(w))
                .isEqualTo(KpiCategory.WORKER_A);
    }

    // ------------------------------------------------------------------
    //  toDto
    // ------------------------------------------------------------------

    @Test
    @DisplayName("toDto : copie integralement les champs metier")
    void toDto_copiesAllFields() {
        DosimetryKpiSnapshot s = DosimetryKpiSnapshot.builder()
                .id(42L).mineId(7L).snapshotDate(LocalDate.of(2026, 1, 15))
                .category(KpiCategory.WORKER_B)
                .workersCount(15).doseRecordsCount(120)
                .avgAnnualDose(new BigDecimal("1.2500"))
                .medianAnnualDose(new BigDecimal("1.1000"))
                .maxAnnualDose(new BigDecimal("3.0000"))
                .workersOver50Pct(4).workersOver75Pct(2)
                .workersOver90Pct(1).workersOver100Pct(0)
                .activeAlertsCount(3).overexposureCasesOpen(1)
                .fitnessExpiringSoon(2).measurementPointsCount(8)
                .ambientAvgUsvh(new BigDecimal("0.5000"))
                .build();
        DosimetryKpiSnapshotDTO dto = service.toDto(s);
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getMineId()).isEqualTo(7L);
        assertThat(dto.getCategory()).isEqualTo(KpiCategory.WORKER_B);
        assertThat(dto.getWorkersCount()).isEqualTo(15L);
        assertThat(dto.getAvgAnnualDose()).isEqualByComparingTo(new BigDecimal("1.2500"));
        assertThat(dto.getMaxAnnualDose()).isEqualByComparingTo(new BigDecimal("3.0000"));
        assertThat(dto.getActiveAlertsCount()).isEqualTo(3L);
    }
}
