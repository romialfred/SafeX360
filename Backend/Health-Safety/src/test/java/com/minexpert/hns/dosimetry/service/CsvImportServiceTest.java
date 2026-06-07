package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.minexpert.hns.dosimetry.dto.CsvImportPreviewDTO;
import com.minexpert.hns.dosimetry.dto.CsvImportResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

/**
 * Tests unitaires du {@link CsvImportService}.
 *
 * <p>Couvre :
 * <ul>
 *   <li>preview CSV valide -> classification correcte des lignes</li>
 *   <li>preview avec doublon en base -> ligne en error DUPLICATE</li>
 *   <li>preview avec hp10 > 50 mSv -> ligne en warning</li>
 *   <li>execute idempotent : re-import meme CSV -> 0 nouveau record + idempotentReplay=true</li>
 *   <li>execute avec skipDuplicates=true sur ligne DUPLICATE -> skippedCount++</li>
 *   <li>execute : worker introuvable -> skipped, pas d'echec global</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CsvImportServiceTest {

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DoseRecordRepository doseRecordRepository;

    @Mock
    private DoseRecordService doseRecordService;

    @Mock
    private DosimetryAuditLogRepository auditLogRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private CsvImportService service;

    private static final Long MINE_ID = 10L;

    // -------------------------------------------------------------------------------------------
    //   Helpers
    // -------------------------------------------------------------------------------------------

    private ExposedWorker worker(Long id, Long employeeId) {
        ExposedWorker w = new ExposedWorker();
        w.setId(id);
        w.setEmployeeId(employeeId);
        w.setMineId(MINE_ID);
        w.setActive(true);
        return w;
    }

    private byte[] csv(String content) {
        return content.getBytes(StandardCharsets.UTF_8);
    }

    private String header() {
        return CsvImportService.EXPECTED_HEADER + "\n";
    }

    // -------------------------------------------------------------------------------------------
    //   preview - cas nominal
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("preview : CSV valide 5 lignes -> 5 rows valid")
    void preview_validCsv_fiveRowsValid() {
        String content = header()
                + "1001,2026-04,1.2,15.5,1.0,AGENCY,false,Routine,\n"
                + "1002,2026-04,0.3,4.1,0.3,AGENCY,true,Below detection,\n"
                + "1003,2026-04,2.0,18.0,1.5,AGENCY,false,,\n"
                + "1004,2026-04,0.8,9.0,0.5,AGENCY,false,,\n"
                + "1005,2026-04,1.5,16.0,1.1,AGENCY,false,,\n";

        when(workerRepository.findByEmployeeId(1001L)).thenReturn(Optional.of(worker(101L, 1001L)));
        when(workerRepository.findByEmployeeId(1002L)).thenReturn(Optional.of(worker(102L, 1002L)));
        when(workerRepository.findByEmployeeId(1003L)).thenReturn(Optional.of(worker(103L, 1003L)));
        when(workerRepository.findByEmployeeId(1004L)).thenReturn(Optional.of(worker(104L, 1004L)));
        when(workerRepository.findByEmployeeId(1005L)).thenReturn(Optional.of(worker(105L, 1005L)));
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(anyLong(), eq("2026-04")))
                .thenReturn(Optional.empty());

        CsvImportPreviewDTO preview = service.preview(csv(content), MINE_ID);

        assertThat(preview.getTotalRows()).isEqualTo(5);
        assertThat(preview.getValidRows()).isEqualTo(5);
        assertThat(preview.getErrorRowsCount()).isEqualTo(0);
        assertThat(preview.getWarningRowsCount()).isEqualTo(0);
        assertThat(preview.getValidRowsDetail()).hasSize(5);
        assertThat(preview.getImportId()).isNotBlank();
    }

    // -------------------------------------------------------------------------------------------
    //   preview - doublon en base
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("preview : record actif deja present -> error DUPLICATE")
    void preview_duplicateInDatabase_errorRow() {
        String content = header() + "1001,2026-04,1.2,15.5,1.0,AGENCY,false,,\n";

        when(workerRepository.findByEmployeeId(1001L)).thenReturn(Optional.of(worker(101L, 1001L)));
        DoseRecord existing = new DoseRecord();
        existing.setId(900L);
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(101L, "2026-04"))
                .thenReturn(Optional.of(existing));

        CsvImportPreviewDTO preview = service.preview(csv(content), MINE_ID);

        assertThat(preview.getTotalRows()).isEqualTo(1);
        assertThat(preview.getValidRows()).isEqualTo(0);
        assertThat(preview.getErrorRowsCount()).isEqualTo(1);
        assertThat(preview.getErrorRows().get(0).getStatus())
                .isEqualTo(CsvImportService.STATUS_DUPLICATE);
    }

    // -------------------------------------------------------------------------------------------
    //   preview - warning > 50 mSv
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("preview : hp10 > 50 mSv -> warning row")
    void preview_valueTooHigh_warningRow() {
        String content = header() + "1001,2026-04,52.0,15.5,1.0,AGENCY,false,,\n";

        when(workerRepository.findByEmployeeId(1001L)).thenReturn(Optional.of(worker(101L, 1001L)));
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(101L, "2026-04"))
                .thenReturn(Optional.empty());

        CsvImportPreviewDTO preview = service.preview(csv(content), MINE_ID);

        assertThat(preview.getTotalRows()).isEqualTo(1);
        assertThat(preview.getWarningRowsCount()).isEqualTo(1);
        assertThat(preview.getErrorRowsCount()).isEqualTo(0);
        assertThat(preview.getWarningRows().get(0).getStatus())
                .isEqualTo(CsvImportService.STATUS_WARNING);
    }

    // -------------------------------------------------------------------------------------------
    //   preview - worker not found
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("preview : matricule inconnu -> error WORKER_NOT_FOUND")
    void preview_unknownMatricule_errorRow() {
        String content = header() + "9999,2026-04,1.2,15.5,1.0,AGENCY,false,,\n";

        when(workerRepository.findByEmployeeId(9999L)).thenReturn(Optional.empty());

        CsvImportPreviewDTO preview = service.preview(csv(content), MINE_ID);

        assertThat(preview.getErrorRowsCount()).isEqualTo(1);
        assertThat(preview.getErrorRows().get(0).getStatus())
                .isEqualTo(CsvImportService.STATUS_WORKER_NOT_FOUND);
    }

    // -------------------------------------------------------------------------------------------
    //   preview - format invalide
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("preview : period invalide / source invalide -> error INVALID_FORMAT")
    void preview_invalidFormat_errorRow() {
        String content = header()
                + "1001,2026-4,1.2,15.5,1.0,AGENCY,false,,\n"           // period mal forme
                + "1002,2026-04,abc,15.5,1.0,AGENCY,false,,\n"          // hp10 NaN
                + "1003,2026-04,1.2,15.5,1.0,UNKNOWN_SRC,false,,\n";    // source inconnue

        // Aucun stubbing necessaire car ces lignes echouent AVANT le lookup worker.
        CsvImportPreviewDTO preview = service.preview(csv(content), MINE_ID);

        assertThat(preview.getTotalRows()).isEqualTo(3);
        assertThat(preview.getErrorRowsCount()).isEqualTo(3);
        assertThat(preview.getErrorRows())
                .allMatch(r -> CsvImportService.STATUS_INVALID_FORMAT.equals(r.getStatus()));
    }

    // -------------------------------------------------------------------------------------------
    //   execute - cas nominal
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("execute : 3 lignes valides -> 3 DoseRecord crees + audit IMPORT_CSV")
    void execute_validCsv_createsRecordsAndAudits() {
        String content = header()
                + "1001,2026-04,1.2,15.5,1.0,AGENCY,false,,\n"
                + "1002,2026-04,0.3,4.1,0.3,AGENCY,true,,\n"
                + "1003,2026-04,2.0,18.0,1.5,AGENCY,false,,\n";

        when(workerRepository.findByEmployeeId(1001L)).thenReturn(Optional.of(worker(101L, 1001L)));
        when(workerRepository.findByEmployeeId(1002L)).thenReturn(Optional.of(worker(102L, 1002L)));
        when(workerRepository.findByEmployeeId(1003L)).thenReturn(Optional.of(worker(103L, 1003L)));
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(anyLong(), eq("2026-04")))
                .thenReturn(Optional.empty());
        when(doseRecordService.create(eq(MINE_ID), any(DoseRecordDTO.class))).thenReturn(500L);

        CsvImportResultDTO result = service.execute(csv(content), MINE_ID, 7L, false);

        assertThat(result.getTotalRows()).isEqualTo(3);
        assertThat(result.getImportedCount()).isEqualTo(3);
        assertThat(result.getSkippedCount()).isEqualTo(0);
        assertThat(result.getErrorCount()).isEqualTo(0);
        assertThat(result.isIdempotentReplay()).isFalse();
        assertThat(result.getImportId()).isNotBlank();
        verify(doseRecordService, times(3)).create(eq(MINE_ID), any(DoseRecordDTO.class));
        verify(auditService, atLeastOnce()).log(
                eq(CsvImportService.AUDIT_ACTION_IMPORT_CSV),
                eq("DoseRecord"),
                eq(MINE_ID),
                eq(7L),
                any(),
                any());
    }

    // -------------------------------------------------------------------------------------------
    //   execute - idempotence
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("execute : meme importId deja audite -> idempotentReplay + 0 nouveau record")
    void execute_sameImportIdPreviouslyLogged_replaysWithoutPersistence() {
        String content = header() + "1001,2026-04,1.2,15.5,1.0,AGENCY,false,,\n";
        byte[] bytes = csv(content);
        String importId = CsvImportService.computeImportId(bytes);

        DosimetryAuditLog previous = DosimetryAuditLog.builder()
                .id(50L)
                .action(CsvImportService.AUDIT_ACTION_IMPORT_CSV)
                .entityType("DoseRecord")
                .entityId(MINE_ID)
                .userId(7L)
                .timestamp(LocalDateTime.now().minusHours(1))
                .details("{\"importId\":\"" + importId + "\",\"totalRows\":1,\"importedCount\":1,"
                        + "\"skippedCount\":0,\"errorCount\":0}")
                .build();
        when(auditLogRepository.findByAction(CsvImportService.AUDIT_ACTION_IMPORT_CSV))
                .thenReturn(List.of(previous));

        CsvImportResultDTO result = service.execute(bytes, MINE_ID, 7L, false);

        assertThat(result.isIdempotentReplay()).isTrue();
        assertThat(result.getImportedCount()).isEqualTo(0);
        assertThat(result.getImportId()).isEqualTo(importId);
        verify(doseRecordService, never()).create(anyLong(), any(DoseRecordDTO.class));
    }

    // -------------------------------------------------------------------------------------------
    //   execute - skipDuplicates
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("execute : skipDuplicates=true sur ligne DUPLICATE -> skipped, pas d'erreur")
    void execute_skipDuplicates_skipsDuplicateRow() {
        String content = header()
                + "1001,2026-04,1.2,15.5,1.0,AGENCY,false,,\n"      // duplicate
                + "1002,2026-04,0.3,4.1,0.3,AGENCY,true,,\n";       // valid

        when(workerRepository.findByEmployeeId(1001L)).thenReturn(Optional.of(worker(101L, 1001L)));
        when(workerRepository.findByEmployeeId(1002L)).thenReturn(Optional.of(worker(102L, 1002L)));
        DoseRecord existing = new DoseRecord();
        existing.setId(900L);
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(101L, "2026-04"))
                .thenReturn(Optional.of(existing));
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(102L, "2026-04"))
                .thenReturn(Optional.empty());
        when(doseRecordService.create(eq(MINE_ID), any(DoseRecordDTO.class))).thenReturn(501L);

        CsvImportResultDTO result = service.execute(csv(content), MINE_ID, 7L, true);

        assertThat(result.getTotalRows()).isEqualTo(2);
        assertThat(result.getImportedCount()).isEqualTo(1);
        assertThat(result.getSkippedCount()).isEqualTo(1);
        assertThat(result.getErrorCount()).isEqualTo(0);
        verify(doseRecordService, times(1)).create(eq(MINE_ID), any(DoseRecordDTO.class));
    }

    // -------------------------------------------------------------------------------------------
    //   execute - worker not found -> skipped (pas d'echec global)
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("execute : worker introuvable -> skipped, autres lignes importees")
    void execute_workerNotFound_skippedNotFailed() {
        String content = header()
                + "9999,2026-04,1.2,15.5,1.0,AGENCY,false,,\n"      // worker not found
                + "1002,2026-04,0.3,4.1,0.3,AGENCY,true,,\n";       // valid

        when(workerRepository.findByEmployeeId(9999L)).thenReturn(Optional.empty());
        when(workerRepository.findByEmployeeId(1002L)).thenReturn(Optional.of(worker(102L, 1002L)));
        when(doseRecordRepository.findActiveByWorkerIdAndPeriod(102L, "2026-04"))
                .thenReturn(Optional.empty());
        when(doseRecordService.create(eq(MINE_ID), any(DoseRecordDTO.class))).thenReturn(502L);

        CsvImportResultDTO result = service.execute(csv(content), MINE_ID, 7L, false);

        assertThat(result.getTotalRows()).isEqualTo(2);
        assertThat(result.getImportedCount()).isEqualTo(1);
        assertThat(result.getSkippedCount()).isEqualTo(1);
        assertThat(result.getErrorCount()).isEqualTo(0);
    }

    // -------------------------------------------------------------------------------------------
    //   history
    // -------------------------------------------------------------------------------------------

    @Test
    @DisplayName("history : filtre par mineId + tri timestamp DESC")
    void history_filtersMineIdAndSortsDesc() {
        DosimetryAuditLog log1 = DosimetryAuditLog.builder()
                .id(1L).action(CsvImportService.AUDIT_ACTION_IMPORT_CSV)
                .entityType("DoseRecord").entityId(MINE_ID).userId(7L)
                .timestamp(LocalDateTime.now().minusDays(2))
                .details("{\"importId\":\"abc\"}").build();
        DosimetryAuditLog log2 = DosimetryAuditLog.builder()
                .id(2L).action(CsvImportService.AUDIT_ACTION_IMPORT_CSV)
                .entityType("DoseRecord").entityId(MINE_ID).userId(7L)
                .timestamp(LocalDateTime.now())
                .details("{\"importId\":\"def\"}").build();
        DosimetryAuditLog logOtherMine = DosimetryAuditLog.builder()
                .id(3L).action(CsvImportService.AUDIT_ACTION_IMPORT_CSV)
                .entityType("DoseRecord").entityId(99L).userId(7L)
                .timestamp(LocalDateTime.now())
                .details("{\"importId\":\"ghi\"}").build();

        when(auditLogRepository.findByAction(CsvImportService.AUDIT_ACTION_IMPORT_CSV))
                .thenReturn(List.of(log1, log2, logOtherMine));

        List<DosimetryAuditLog> result = service.history(MINE_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(2L); // plus recent en tete
        assertThat(result.get(1).getId()).isEqualTo(1L);
    }
}
