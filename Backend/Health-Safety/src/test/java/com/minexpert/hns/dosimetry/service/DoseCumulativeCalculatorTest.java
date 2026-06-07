package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;

/**
 * Tests du moteur de cumul dosimetrique.
 *
 * <p>Couvre :
 * <ul>
 *   <li>annual sum sur enregistrements actifs (supersededRecordId IS NULL)</li>
 *   <li>rolling 5y : somme des annees N-4..N inclus</li>
 *   <li>lifetime : somme totale des enregistrements actifs</li>
 *   <li>filtrage : les records superseded NE doivent PAS etre comptes (assure via la query
 *       repository.findActiveByWorkerIdAndYear / findActiveByWorkerId)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DoseCumulativeCalculatorTest {

    @Mock
    private DoseRecordRepository doseRecordRepository;

    @Mock
    private DoseCumulativeRepository doseCumulativeRepository;

    @InjectMocks
    private DoseCumulativeCalculator calculator;

    // ------- Helpers -----------------------------------------------------------

    private DoseRecord rec(double hp10) {
        DoseRecord r = new DoseRecord();
        r.setHp10(hp10);
        return r;
    }

    private void stubEmpty(Long workerId, int year) {
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq(String.valueOf(year))))
                .thenReturn(Collections.emptyList());
    }

    // ------- Tests -------------------------------------------------------------

    @Test
    @DisplayName("recompute : somme annuelle des hp10 sur enregistrements ACTIFS")
    void recompute_sumsActiveHp10() {
        Long workerId = 1L;
        int year = 2026;

        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2026")))
                .thenReturn(Arrays.asList(rec(1.5), rec(2.0)));
        stubEmpty(workerId, 2025);
        stubEmpty(workerId, 2024);
        stubEmpty(workerId, 2023);
        stubEmpty(workerId, 2022);

        when(doseRecordRepository.findActiveByWorkerId(workerId))
                .thenReturn(Arrays.asList(rec(1.5), rec(2.0)));
        when(doseCumulativeRepository.findByWorkerIdAndYear(workerId, year))
                .thenReturn(Optional.empty());
        when(doseCumulativeRepository.save(any(DoseCumulative.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DoseCumulative result = calculator.recompute(workerId, year);

        assertThat(result.getAnnualHp10()).isEqualTo(3.5);
        assertThat(result.getRolling5yHp10()).isEqualTo(3.5);
        assertThat(result.getLifetimeHp10()).isEqualTo(3.5);
        assertThat(result.getWorkerId()).isEqualTo(workerId);
        assertThat(result.getYear()).isEqualTo(year);
    }

    @Test
    @DisplayName("recompute : rolling5y somme bien les 5 annees N-4..N")
    void recompute_rolling5yAcrossFiveYears() {
        Long workerId = 2L;
        int year = 2026;

        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2026")))
                .thenReturn(Collections.singletonList(rec(3.0)));
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2025")))
                .thenReturn(Collections.singletonList(rec(2.5)));
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2024")))
                .thenReturn(Collections.singletonList(rec(4.0)));
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2023")))
                .thenReturn(Collections.singletonList(rec(1.5)));
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2022")))
                .thenReturn(Collections.singletonList(rec(2.0)));

        when(doseRecordRepository.findActiveByWorkerId(workerId))
                .thenReturn(Arrays.asList(rec(3.0), rec(2.5), rec(4.0), rec(1.5), rec(2.0), rec(0.5)));

        when(doseCumulativeRepository.findByWorkerIdAndYear(workerId, year))
                .thenReturn(Optional.empty());
        when(doseCumulativeRepository.save(any(DoseCumulative.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DoseCumulative result = calculator.recompute(workerId, year);

        // 3.0 + 2.5 + 4.0 + 1.5 + 2.0 = 13.0
        assertThat(result.getRolling5yHp10()).isEqualTo(13.0);
        // Annual = annee N seulement = 3.0
        assertThat(result.getAnnualHp10()).isEqualTo(3.0);
        // Lifetime = tous les actifs (3 + 2.5 + 4 + 1.5 + 2 + 0.5) = 13.5
        assertThat(result.getLifetimeHp10()).isEqualTo(13.5);
    }

    @Test
    @DisplayName("recompute : repository.findActiveByWorkerIdAndYear est appele - garantit "
            + "que les records superseded sont exclus (filtre supersededRecordId IS NULL)")
    void recompute_callsActiveOnlyQuery() {
        Long workerId = 3L;
        int year = 2026;

        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), any()))
                .thenReturn(Collections.emptyList());
        when(doseRecordRepository.findActiveByWorkerId(workerId))
                .thenReturn(Collections.emptyList());
        when(doseCumulativeRepository.findByWorkerIdAndYear(workerId, year))
                .thenReturn(Optional.empty());
        when(doseCumulativeRepository.save(any(DoseCumulative.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        calculator.recompute(workerId, year);

        // 1 invocation pour le calcul annuel + 5 pour le rolling 5y (year-4..year inclus) = 6.
        verify(doseRecordRepository, times(6))
                .findActiveByWorkerIdAndYear(eq(workerId), any());
        // Lifetime utilise findActiveByWorkerId (qui filtre supersededRecordId IS NULL).
        verify(doseRecordRepository, times(1)).findActiveByWorkerId(workerId);
    }

    @Test
    @DisplayName("recompute : upsert correct - reutilise l'entite existante si presente")
    void recompute_upsertsExistingCumulative() {
        Long workerId = 4L;
        int year = 2026;

        DoseCumulative existing = new DoseCumulative();
        existing.setId(999L);
        existing.setWorkerId(workerId);
        existing.setYear(year);
        existing.setAnnualHp10(1.0); // valeur obsolete a ecraser

        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2026")))
                .thenReturn(Collections.singletonList(rec(5.0)));
        stubEmpty(workerId, 2025);
        stubEmpty(workerId, 2024);
        stubEmpty(workerId, 2023);
        stubEmpty(workerId, 2022);

        when(doseRecordRepository.findActiveByWorkerId(workerId))
                .thenReturn(Collections.singletonList(rec(5.0)));
        when(doseCumulativeRepository.findByWorkerIdAndYear(workerId, year))
                .thenReturn(Optional.of(existing));
        when(doseCumulativeRepository.save(any(DoseCumulative.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DoseCumulative result = calculator.recompute(workerId, year);

        assertThat(result.getId()).isEqualTo(999L);
        assertThat(result.getAnnualHp10()).isEqualTo(5.0); // ecrase 1.0
    }
}
