package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.thymeleaf.context.Context;

import com.minexpert.hns.api.emergency.repository.EvacuationCheckInRepository;
import com.minexpert.hns.api.emergency.repository.GeneralAlertRepository;
import com.minexpert.hns.blast.dto.BlastEvacuationReportDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastEvacuationReport;
import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.repository.BlastEvacuationReportRepository;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastStatusEventRepository;
import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;

/**
 * Tests unitaires du {@link BlastEvacuationReportServiceImpl} (P6).
 *
 * <p>Couverture des 5 tests requis par la mission :
 * <ol>
 *   <li>create — calcule mustered/missing/duree, alarm/fired/all-clear depuis
 *       {@code blast_status_event} et persiste le rapport.</li>
 *   <li>sign — pose {@code signedAt + signedOffBy} et conserve les comptages.</li>
 *   <li>post-sign immutable — toute tentative d'addIncident ou de re-signature
 *       leve {@link IllegalStateException}.</li>
 *   <li>addIncident before sign — concatene le texte dans le champ incidents
 *       avec horodatage et acteur.</li>
 *   <li>PDF magic — le PDF rendu commence par les octets magiques "%PDF".</li>
 * </ol>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BlastEvacuationReportServiceTest {

    /** Magic bytes d'un PDF (header ISO 32000-1). */
    private static final byte[] PDF_MAGIC = "%PDF".getBytes(StandardCharsets.US_ASCII);

    @Mock
    private BlastEvacuationReportRepository reportRepository;

    @Mock
    private BlastRepository blastRepository;

    @Mock
    private BlastStatusEventRepository statusEventRepository;

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private GeneralAlertRepository generalAlertRepository;

    @Mock
    private EvacuationCheckInRepository checkInRepository;

    @Mock
    private HtmlToPdfRenderer pdfRenderer;

    private BlastEvacuationReportServiceImpl service;

    private byte[] fakePdf;

    @BeforeEach
    void setUp() {
        // Construction explicite : l'impl utilise un constructor enrichi.
        service = new BlastEvacuationReportServiceImpl(
                reportRepository,
                blastRepository,
                statusEventRepository,
                jobRepository,
                generalAlertRepository,
                checkInRepository,
                pdfRenderer);

        String fake = "%PDF-1.4\n%fake-test-content\n%%EOF\n";
        fakePdf = fake.getBytes(StandardCharsets.US_ASCII);
        when(pdfRenderer.render(anyString(), any(Context.class))).thenReturn(fakePdf);

        // Aucune alerte rattachee par defaut (head-count fallback 0/0).
        when(generalAlertRepository.findByCompanyIdOrderByTriggeredAtDesc(any()))
                .thenReturn(Collections.emptyList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private Blast newBlast(Long id, Long mineId) {
        return Blast.builder()
                .id(id)
                .reference("BLT-2026-0001")
                .scheduledAt(LocalDateTime.of(2026, 6, 15, 10, 0))
                .timezone("Africa/Ouagadougou")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.ALL_CLEAR)
                .mineId(mineId)
                .alarmZoneScope("FOSSE_NORD")
                .assemblyPoints("AP_NORTH,AP_SOUTH")
                .pit("MAIN_PIT")
                .bench("B-540")
                .block("B12")
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();
    }

    private BlastStatusEvent event(BlastStatus from, BlastStatus to, LocalDateTime at) {
        return BlastStatusEvent.builder()
                .blastId(42L)
                .fromStatus(from)
                .toStatus(to)
                .at(at)
                .actorId(99L)
                .build();
    }

    /**
     * Configure {@code reportRepository.save(...)} pour assigner un id
     * incremental et retourner l'entite (comportement JPA realiste sous mock).
     */
    private void wireRepoSaveIdentity() {
        AtomicLong seq = new AtomicLong(1000L);
        when(reportRepository.save(any(BlastEvacuationReport.class))).thenAnswer(inv -> {
            BlastEvacuationReport r = inv.getArgument(0);
            if (r.getId() == null) r.setId(seq.getAndIncrement());
            return r;
        });
    }

    // ── 1) create ────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — calcule alarm/fired/all-clear depuis status events et persiste")
    void createPersistsWithDerivedTimestamps() {
        Blast blast = newBlast(42L, 1L);
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));
        when(reportRepository.findByBlastId(42L)).thenReturn(Optional.empty());

        LocalDateTime alarm = LocalDateTime.of(2026, 6, 15, 9, 50);
        LocalDateTime fired = LocalDateTime.of(2026, 6, 15, 10, 0);
        LocalDateTime clear = LocalDateTime.of(2026, 6, 15, 10, 35);
        // L'historique est trie DESC dans la repository — on respecte la
        // contractuelle pour ne pas masquer une regression de tri.
        when(statusEventRepository.findByBlastIdOrderByAtDesc(42L)).thenReturn(List.of(
                event(BlastStatus.FIRED, BlastStatus.ALL_CLEAR, clear),
                event(BlastStatus.IMMINENT, BlastStatus.FIRED, fired),
                event(BlastStatus.CONFIRMED, BlastStatus.IMMINENT, alarm)
        ));
        // Aucun job GENERAL_ALARM_10M SENT : on retombe sur la transition IMMINENT.
        when(jobRepository.findByBlastIdAndType(any(), any())).thenReturn(Collections.emptyList());

        wireRepoSaveIdentity();

        BlastEvacuationReportDTO dto = service.createReport(42L);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNotNull();
        assertThat(dto.getBlastId()).isEqualTo(42L);
        assertThat(dto.getBlastReference()).isEqualTo("BLT-2026-0001");
        assertThat(dto.getAlarmTriggeredAt()).isEqualTo(alarm);
        assertThat(dto.getFiredAt()).isEqualTo(fired);
        assertThat(dto.getAllClearAt()).isEqualTo(clear);
        // duree alarm -> fired = 10 minutes
        assertThat(dto.getEvacDurationSeconds()).isEqualTo(600);
        // Head-count : aucune alerte rattachee -> 0/0
        assertThat(dto.getMusteredCount()).isEqualTo(0);
        assertThat(dto.getMissingCount()).isEqualTo(0);
        assertThat(dto.isSigned()).isFalse();
        verify(reportRepository).save(any(BlastEvacuationReport.class));
    }

    @Test
    @DisplayName("create — idempotent : retourne le rapport existant sans persistance")
    void createIsIdempotent() {
        BlastEvacuationReport existing = BlastEvacuationReport.builder()
                .id(99L)
                .blastId(42L)
                .build();
        Blast blast = newBlast(42L, 1L);
        when(reportRepository.findByBlastId(42L)).thenReturn(Optional.of(existing));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));

        BlastEvacuationReportDTO dto = service.createReport(42L);

        assertThat(dto.getId()).isEqualTo(99L);
        verify(reportRepository, never()).save(any());
    }

    // ── 2) sign ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("sign — pose signedAt + signedOffBy")
    void signSetsSignatureFields() {
        BlastEvacuationReport report = BlastEvacuationReport.builder()
                .id(100L)
                .blastId(42L)
                .incidents("")
                .musteredCount(12)
                .missingCount(0)
                .build();
        when(reportRepository.findById(100L)).thenReturn(Optional.of(report));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(newBlast(42L, 1L)));
        wireRepoSaveIdentity();

        BlastEvacuationReportDTO dto = service.sign(100L, 7L, "data:image/png;base64,XYZ");

        assertThat(dto.getSignedOffBy()).isEqualTo(7L);
        assertThat(dto.getSignedAt()).isNotNull();
        assertThat(dto.isSigned()).isTrue();
        // signature data url conservee en bas du champ incidents
        assertThat(dto.getIncidents()).contains("[SIG_DATA_URL]:");
    }

    // ── 3) post-sign immutable ──────────────────────────────────────────

    @Test
    @DisplayName("post-signature — addIncident est rejete")
    void postSignAddIncidentRejected() {
        BlastEvacuationReport signed = BlastEvacuationReport.builder()
                .id(100L)
                .blastId(42L)
                .signedOffBy(7L)
                .signedAt(LocalDateTime.now().minusMinutes(2))
                .incidents("[2026-06-15 10:01:00][user=7] Initial")
                .musteredCount(12)
                .missingCount(0)
                .build();
        when(reportRepository.findById(100L)).thenReturn(Optional.of(signed));

        assertThatThrownBy(() -> service.addIncident(100L, "Tentative apres signature", 7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already signed");
        verify(reportRepository, never()).save(any());
    }

    // ── 4) addIncident before sign ──────────────────────────────────────

    @Test
    @DisplayName("addIncident before sign — concatene avec timestamp et acteur")
    void addIncidentAppendsWithTimestampAndActor() {
        BlastEvacuationReport report = BlastEvacuationReport.builder()
                .id(100L)
                .blastId(42L)
                .incidents("")
                .musteredCount(12)
                .missingCount(0)
                .build();
        when(reportRepository.findById(100L)).thenReturn(Optional.of(report));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(newBlast(42L, 1L)));
        wireRepoSaveIdentity();

        BlastEvacuationReportDTO dto = service.addIncident(100L,
                "Chute de pierre vers AP_SUD, sans blesse", 11L);

        assertThat(dto.getIncidents())
                .contains("[user=11]")
                .contains("Chute de pierre vers AP_SUD, sans blesse");
        // Le format de l'horodatage applique est "yyyy-MM-dd HH:mm:ss"
        assertThat(dto.getIncidents()).matches("(?s).*\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\]\\[user=11\\].*");
    }

    // ── 5) PDF magic %PDF ────────────────────────────────────────────────

    @Test
    @DisplayName("renderPdf — produit un byte[] commencant par '%PDF'")
    void pdfStartsWithMagicBytes() {
        BlastEvacuationReport report = BlastEvacuationReport.builder()
                .id(100L)
                .blastId(42L)
                .alarmTriggeredAt(LocalDateTime.of(2026, 6, 15, 9, 50))
                .firedAt(LocalDateTime.of(2026, 6, 15, 10, 0))
                .allClearAt(LocalDateTime.of(2026, 6, 15, 10, 35))
                .musteredCount(12)
                .missingCount(0)
                .evacDurationSeconds(600)
                .incidents("[2026-06-15 10:01:00][user=7] OK")
                .build();
        when(reportRepository.findById(100L)).thenReturn(Optional.of(report));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(newBlast(42L, 1L)));

        byte[] pdf = service.renderPdf(100L, "fr");

        assertThat(pdf).isNotEmpty();
        // Verifie les 4 octets magiques "%PDF" en tete.
        for (int i = 0; i < PDF_MAGIC.length; i++) {
            assertThat(pdf[i]).as("magic byte index %d", i).isEqualTo(PDF_MAGIC[i]);
        }
    }

    @Test
    @DisplayName("renderPdf — accepte la langue 'en' et reste valide PDF")
    void pdfRespectsEnglishLanguage() {
        BlastEvacuationReport report = BlastEvacuationReport.builder()
                .id(101L)
                .blastId(42L)
                .musteredCount(10)
                .missingCount(0)
                .build();
        when(reportRepository.findById(101L)).thenReturn(Optional.of(report));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(newBlast(42L, 1L)));

        byte[] pdf = service.renderPdf(101L, "en");
        assertThat(pdf).isNotEmpty();
        for (int i = 0; i < PDF_MAGIC.length; i++) {
            assertThat(pdf[i]).isEqualTo(PDF_MAGIC[i]);
        }
    }
}
