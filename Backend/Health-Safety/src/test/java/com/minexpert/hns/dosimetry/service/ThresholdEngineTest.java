package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.entity.Threshold;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

/**
 * Smoke tests du moteur d'alertes dosimetriques.
 */
@ExtendWith(MockitoExtension.class)
class ThresholdEngineTest {

    @Mock
    private ThresholdRepository thresholdRepository;

    @Mock
    private ExposureAlertRepository exposureAlertRepository;

    @InjectMocks
    private ThresholdEngine engine;

    @Test
    @DisplayName("check produit une alerte EXCEEDED quand hp10 depasse regulatoryLimit")
    void check_producesExceededAlert() {
        ExposedWorker worker = new ExposedWorker();
        worker.setId(1L);
        worker.setMineId(10L);
        worker.setCategory(DoseCategory.A);

        DoseRecord record = new DoseRecord();
        record.setWorker(worker);
        record.setHp10(25.0);

        Threshold t = new Threshold();
        t.setId(99L);
        t.setRegulatoryLimit(20.0);
        t.setActionLevel(15.0);
        t.setInvestigationLevel(10.0);
        t.setWarnPercentages("[75,90]");

        when(thresholdRepository.findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(
                any(), any(ThresholdGrandeur.class), anyString()))
                .thenReturn(Optional.of(t));
        when(exposureAlertRepository.save(any(ExposureAlert.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<ExposureAlert> alerts = engine.check(record);

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.EXCEEDED);
        assertThat(alerts.get(0).getGrandeur()).isEqualTo(ThresholdGrandeur.HP10);
        assertThat(alerts.get(0).getValue()).isEqualTo(25.0);
        assertThat(alerts.get(0).getWorkerId()).isEqualTo(1L);
        assertThat(alerts.get(0).getThresholdId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("check produit une alerte APPROACH quand hp10 est entre 90% et regulatoryLimit")
    void check_producesApproachAlertWhenAboveWarnPct() {
        ExposedWorker worker = new ExposedWorker();
        worker.setId(2L);
        worker.setMineId(10L);
        worker.setCategory(DoseCategory.B);

        DoseRecord record = new DoseRecord();
        record.setWorker(worker);
        record.setHp10(18.5); // 92.5% de 20

        Threshold t = new Threshold();
        t.setId(100L);
        t.setRegulatoryLimit(20.0);
        t.setActionLevel(19.5);
        t.setInvestigationLevel(19.0);
        t.setWarnPercentages("[75,90]");

        when(thresholdRepository.findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(
                any(), any(ThresholdGrandeur.class), anyString()))
                .thenReturn(Optional.of(t));
        when(exposureAlertRepository.save(any(ExposureAlert.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<ExposureAlert> alerts = engine.check(record);

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.APPROACH);
    }
}
