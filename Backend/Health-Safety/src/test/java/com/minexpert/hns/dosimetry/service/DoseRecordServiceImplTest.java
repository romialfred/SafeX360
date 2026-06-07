package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

import com.minexpert.hns.dosimetry.dto.DoseRecordCreateResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordSupersedeRequestDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSource;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

/**
 * Tests unitaires du service DoseRecord (Phase 4).
 *
 * <p>Couvre :
 * <ul>
 *   <li>create nominal -> persiste + recompute + threshold engine + audit</li>
 *   <li>create duplicate (record actif existe deja) -> IllegalStateException</li>
 *   <li>supersede nominal -> chaine OK</li>
 *   <li>supersede d'un record deja superseded -> IllegalStateException</li>
 *   <li>supersede declenche recompute + alertes</li>
 *   <li>flag requiresDoubleValidation au dela des seuils nominatifs</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DoseRecordServiceImplTest {

    @Mock
    private DoseRecordRepository repository;

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DosimetryAuditLogRepository auditLogRepository;

    @Mock
    private DoseCumulativeCalculator cumulativeCalculator;

    @Mock
    private ThresholdEngine thresholdEngine;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private DoseRecordServiceImpl service;

    private ExposedWorker worker;

    @BeforeEach
    void setUp() {
        worker = new ExposedWorker();
        worker.setId(1L);
        worker.setMineId(10L);
        worker.setCategory(DoseCategory.A);
    }

    // ------- Helpers -----------------------------------------------------------

    private DoseRecordDTO createDto(double hp10) {
        DoseRecordDTO dto = new DoseRecordDTO();
        dto.setWorkerId(1L);
        dto.setPeriod("2026-01");
        dto.setHp10(hp10);
        dto.setSource(DoseSource.AGENCY);
        dto.setRecordedBy(5L);
        return dto;
    }

    private DoseRecord savedRecord(Long id, int version, double hp10) {
        DoseRecord r = new DoseRecord();
        r.setId(id);
        r.setWorker(worker);
        r.setPeriod("2026-01");
        r.setHp10(hp10);
        r.setVersion(version);
        return r;
    }

    // ------- create nominal ----------------------------------------------------

    @Test
    @DisplayName("create : nominal -> persiste, recompute, threshold engine, audit")
    void create_nominal_triggersAllPipelines() {
        DoseRecordDTO dto = createDto(2.5);

        when(repository.findActiveByWorkerIdAndPeriod(1L, "2026-01"))
                .thenReturn(Optional.empty());
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(repository.save(any(DoseRecord.class))).thenAnswer(inv -> {
            DoseRecord arg = inv.getArgument(0);
            arg.setId(100L);
            return arg;
        });
        when(thresholdEngine.evaluateAndCreateAlerts(any(DoseRecord.class)))
                .thenReturn(Collections.<ExposureAlert>emptyList());

        DoseRecordCreateResultDTO result = service.createWithResult(99L, dto);

        assertThat(result.getRecordId()).isEqualTo(100L);
        assertThat(result.getVersion()).isEqualTo(1);
        assertThat(result.isRequiresDoubleValidation()).isFalse();
        assertThat(result.getAlertsCreated()).isEqualTo(0);

        verify(cumulativeCalculator, times(1)).recompute(eq(1L), eq(2026));
        verify(thresholdEngine, times(1)).evaluateAndCreateAlerts(any(DoseRecord.class));
        verify(auditLogRepository, times(1)).save(any());
        verify(auditService, times(1)).log(eq("CREATE"), eq("DoseRecord"),
                eq(100L), eq(5L), any(), any());
    }

    // ------- create duplicate -> exception -------------------------------------

    @Test
    @DisplayName("create : doublon (record actif existant) -> IllegalStateException")
    void create_duplicate_throwsIllegalStateException() {
        DoseRecordDTO dto = createDto(1.0);
        DoseRecord existing = savedRecord(99L, 1, 0.5);

        when(repository.findActiveByWorkerIdAndPeriod(1L, "2026-01"))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.createWithResult(99L, dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("supersede");

        verify(repository, times(0)).save(any(DoseRecord.class));
        verify(cumulativeCalculator, times(0)).recompute(anyLong(), anyInt());
    }

    // ------- create avec flag double validation --------------------------------

    @Test
    @DisplayName("create : hp10 > 10 mSv -> requiresDoubleValidation = true")
    void create_highHp10_setsDoubleValidationFlag() {
        DoseRecordDTO dto = createDto(15.0); // > 10 mSv

        when(repository.findActiveByWorkerIdAndPeriod(1L, "2026-01"))
                .thenReturn(Optional.empty());
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(repository.save(any(DoseRecord.class))).thenAnswer(inv -> {
            DoseRecord arg = inv.getArgument(0);
            arg.setId(101L);
            return arg;
        });
        when(thresholdEngine.evaluateAndCreateAlerts(any(DoseRecord.class)))
                .thenReturn(Collections.<ExposureAlert>emptyList());

        DoseRecordCreateResultDTO result = service.createWithResult(99L, dto);

        assertThat(result.isRequiresDoubleValidation()).isTrue();
    }

    // ------- supersede nominal -------------------------------------------------

    @Test
    @DisplayName("supersede : nominal -> nouveau version+1 + chaine + recompute + alertes")
    void supersede_nominal_chainsAndRecomputes() {
        DoseRecord previous = savedRecord(50L, 1, 1.0);
        previous.setSupersededRecordId(null);

        DoseRecordSupersedeRequestDTO req = new DoseRecordSupersedeRequestDTO();
        req.setOriginalId(50L);
        req.setReason("Correction agence apres re-lecture");
        req.setWorkerId(1L);
        req.setPeriod("2026-01");
        req.setHp10(1.2);
        req.setSource(DoseSource.AGENCY);
        req.setActorId(7L);

        when(repository.findById(50L)).thenReturn(Optional.of(previous));
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(repository.save(any(DoseRecord.class))).thenAnswer(inv -> {
            DoseRecord arg = inv.getArgument(0);
            arg.setId(51L);
            return arg;
        });
        when(repository.updateSupersededRecordId(50L, 51L)).thenReturn(1);
        when(thresholdEngine.evaluateAndCreateAlerts(any(DoseRecord.class)))
                .thenReturn(Collections.<ExposureAlert>emptyList());

        DoseRecordCreateResultDTO result = service.supersedeWithResult(99L, req);

        assertThat(result.getRecordId()).isEqualTo(51L);
        assertThat(result.getVersion()).isEqualTo(2);

        verify(repository, times(1)).updateSupersededRecordId(50L, 51L);
        verify(cumulativeCalculator, times(1)).recompute(eq(1L), eq(2026));
        verify(thresholdEngine, times(1)).evaluateAndCreateAlerts(any(DoseRecord.class));
        verify(auditService, times(1)).log(eq("SUPERSEDE"), eq("DoseRecord"),
                eq(51L), eq(7L), any(), any());
    }

    // ------- supersede deja superseded -> exception ----------------------------

    @Test
    @DisplayName("supersede : record deja superseded -> IllegalStateException (chain sealed)")
    void supersede_alreadySuperseded_throwsIllegalStateException() {
        DoseRecord previous = savedRecord(60L, 1, 1.0);
        previous.setSupersededRecordId(99L); // deja superseded

        DoseRecordSupersedeRequestDTO req = new DoseRecordSupersedeRequestDTO();
        req.setOriginalId(60L);
        req.setReason("trying to update sealed chain");
        req.setWorkerId(1L);
        req.setPeriod("2026-01");
        req.setHp10(1.5);
        req.setSource(DoseSource.AGENCY);

        when(repository.findById(60L)).thenReturn(Optional.of(previous));

        assertThatThrownBy(() -> service.supersedeWithResult(99L, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already superseded");

        verify(repository, times(0)).save(any(DoseRecord.class));
        verify(cumulativeCalculator, times(0)).recompute(anyLong(), anyInt());
    }

    // ------- supersede declenche alertes ---------------------------------------

    @Test
    @DisplayName("supersede : declenche threshold engine et compte les alertes creees")
    void supersede_triggersThresholdEngine() {
        DoseRecord previous = savedRecord(70L, 2, 1.0);
        previous.setSupersededRecordId(null);

        DoseRecordSupersedeRequestDTO req = new DoseRecordSupersedeRequestDTO();
        req.setOriginalId(70L);
        req.setReason("correction overexposure");
        req.setWorkerId(1L);
        req.setPeriod("2026-03");
        req.setHp10(25.0);
        req.setSource(DoseSource.AGENCY);
        req.setActorId(8L);

        when(repository.findById(70L)).thenReturn(Optional.of(previous));
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(repository.save(any(DoseRecord.class))).thenAnswer(inv -> {
            DoseRecord arg = inv.getArgument(0);
            arg.setId(71L);
            return arg;
        });
        when(repository.updateSupersededRecordId(70L, 71L)).thenReturn(1);

        ExposureAlert mockAlert = ExposureAlert.builder().id(1L).workerId(1L).build();
        when(thresholdEngine.evaluateAndCreateAlerts(any(DoseRecord.class)))
                .thenReturn(List.of(mockAlert));

        DoseRecordCreateResultDTO result = service.supersedeWithResult(99L, req);

        assertThat(result.getAlertsCreated()).isEqualTo(1);
        assertThat(result.isRequiresDoubleValidation()).isTrue(); // hp10=25 > 10
        verify(cumulativeCalculator, times(1)).recompute(eq(1L), eq(2026));
    }
}
