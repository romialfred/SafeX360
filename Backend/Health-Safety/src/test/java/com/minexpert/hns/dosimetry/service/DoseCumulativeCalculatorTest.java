package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
 * Smoke tests du moteur de cumul dosimetrique.
 */
@ExtendWith(MockitoExtension.class)
class DoseCumulativeCalculatorTest {

    @Mock
    private DoseRecordRepository doseRecordRepository;

    @Mock
    private DoseCumulativeRepository doseCumulativeRepository;

    @InjectMocks
    private DoseCumulativeCalculator calculator;

    @Test
    @DisplayName("recompute somme correctement les hp10 actifs pour l'annee courante")
    void recompute_sumsActiveHp10() {
        Long workerId = 1L;
        int year = 2026;

        DoseRecord r1 = new DoseRecord();
        r1.setHp10(1.5);
        DoseRecord r2 = new DoseRecord();
        r2.setHp10(2.0);

        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2026")))
                .thenReturn(Arrays.asList(r1, r2));
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2025")))
                .thenReturn(Collections.emptyList());
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2024")))
                .thenReturn(Collections.emptyList());
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2023")))
                .thenReturn(Collections.emptyList());
        when(doseRecordRepository.findActiveByWorkerIdAndYear(eq(workerId), eq("2022")))
                .thenReturn(Collections.emptyList());

        when(doseRecordRepository.findActiveByWorkerId(workerId))
                .thenReturn(Arrays.asList(r1, r2));

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
}
