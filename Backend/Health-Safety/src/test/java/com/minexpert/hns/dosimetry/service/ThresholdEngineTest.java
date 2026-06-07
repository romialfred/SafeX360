package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.ThresholdGrandeur;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.ThresholdRepository;

/**
 * Tests du moteur d'alertes dosimetriques.
 *
 * <p>Couvre les 5 niveaux d'evaluation (NONE / APPROACH / INVESTIGATION / ACTION / EXCEEDED)
 * + idempotence (pas de doublon d'alerte ACTIVE pour le meme triplet).
 */
@ExtendWith(MockitoExtension.class)
class ThresholdEngineTest {

    @Mock
    private ThresholdRepository thresholdRepository;

    @Mock
    private ExposureAlertRepository exposureAlertRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private ThresholdEngine engine;

    // ------- Helpers -----------------------------------------------------------

    private Threshold standardThreshold() {
        Threshold t = new Threshold();
        t.setId(99L);
        t.setRegulatoryLimit(20.0);
        t.setActionLevel(18.0);
        t.setInvestigationLevel(15.0);
        t.setWarnPercentages("[75,90]");
        return t;
    }

    private DoseRecord recordHp10(double hp10) {
        ExposedWorker worker = new ExposedWorker();
        worker.setId(1L);
        worker.setMineId(10L);
        worker.setCategory(DoseCategory.A);
        DoseRecord r = new DoseRecord();
        r.setWorker(worker);
        r.setHp10(hp10);
        return r;
    }

    private void stubThreshold(Threshold t) {
        when(thresholdRepository.findByMineIdAndGrandeurAndPersonCategoryAndActiveTrue(
                any(), any(ThresholdGrandeur.class), anyString()))
                .thenReturn(Optional.of(t));
    }

    private void stubNoExistingAlert() {
        when(exposureAlertRepository.findActiveByWorkerGrandeurLevel(
                anyLong(), any(ThresholdGrandeur.class), any(AlertLevel.class),
                eq(AlertStatus.ACTIVE)))
                .thenReturn(Optional.empty());
    }

    private void stubSave() {
        when(exposureAlertRepository.save(any(ExposureAlert.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ------- Test 5 niveaux ----------------------------------------------------

    @Test
    @DisplayName("NONE : ratio < 50% -> aucune alerte produite")
    void check_none_below50pct() {
        // 8 / 20 = 40% -> NONE
        stubThreshold(standardThreshold());
        List<ExposureAlert> alerts = engine.check(recordHp10(8.0));
        assertThat(alerts).isEmpty();
    }

    @Test
    @DisplayName("APPROACH : 50% <= ratio < 75% -> APPROACH")
    void check_approach_between50and75pct() {
        // 13 / 20 = 65% -> APPROACH
        stubThreshold(standardThreshold());
        stubNoExistingAlert();
        stubSave();

        List<ExposureAlert> alerts = engine.check(recordHp10(13.0));

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.APPROACH);
    }

    @Test
    @DisplayName("INVESTIGATION : 75% <= ratio < 90% -> INVESTIGATION")
    void check_investigation_between75and90pct() {
        // 16 / 20 = 80% -> INVESTIGATION
        stubThreshold(standardThreshold());
        stubNoExistingAlert();
        stubSave();

        List<ExposureAlert> alerts = engine.check(recordHp10(16.0));

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.INVESTIGATION);
    }

    @Test
    @DisplayName("ACTION : 90% <= ratio < 100% -> ACTION")
    void check_action_between90and100pct() {
        // 18.5 / 20 = 92.5% -> ACTION
        stubThreshold(standardThreshold());
        stubNoExistingAlert();
        stubSave();

        List<ExposureAlert> alerts = engine.check(recordHp10(18.5));

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.ACTION);
    }

    @Test
    @DisplayName("EXCEEDED : ratio >= 100% -> EXCEEDED")
    void check_exceeded_atOrAboveLimit() {
        // 25 / 20 = 125% -> EXCEEDED
        stubThreshold(standardThreshold());
        stubNoExistingAlert();
        stubSave();

        List<ExposureAlert> alerts = engine.check(recordHp10(25.0));

        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getLevel()).isEqualTo(AlertLevel.EXCEEDED);
        assertThat(alerts.get(0).getThresholdId()).isEqualTo(99L);
        assertThat(alerts.get(0).getWorkerId()).isEqualTo(1L);
        assertThat(alerts.get(0).getValue()).isEqualTo(25.0);
    }

    // ------- Test idempotence --------------------------------------------------

    @Test
    @DisplayName("Idempotence : pas de doublon si une alerte ACTIVE non-ack existe deja")
    void check_idempotent_doesNotCreateDuplicate() {
        stubThreshold(standardThreshold());
        // Une alerte EXCEEDED ACTIVE non-ack existe deja pour ce (worker, HP10).
        ExposureAlert existing = ExposureAlert.builder()
                .id(42L)
                .workerId(1L)
                .grandeur(ThresholdGrandeur.HP10)
                .level(AlertLevel.EXCEEDED)
                .status(AlertStatus.ACTIVE)
                .build();
        when(exposureAlertRepository.findActiveByWorkerGrandeurLevel(
                eq(1L), eq(ThresholdGrandeur.HP10), eq(AlertLevel.EXCEEDED),
                eq(AlertStatus.ACTIVE)))
                .thenReturn(Optional.of(existing));

        List<ExposureAlert> alerts = engine.check(recordHp10(25.0));

        assertThat(alerts).isEmpty();
        // Verification : save ne doit JAMAIS etre appele.
        verify(exposureAlertRepository, times(0)).save(any(ExposureAlert.class));
    }
}
