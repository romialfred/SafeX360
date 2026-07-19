package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.thymeleaf.context.Context;

import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.AlertLevel;
import com.minexpert.hns.dosimetry.enums.CaseStatus;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;
import com.minexpert.hns.dosimetry.enums.FitnessLevel;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;
import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;

/**
 * Tests unitaires de {@link DosimetryReportServiceImpl} (Phase 9).
 *
 * <p>Couverture :
 * <ul>
 *   <li>L'attestation individuelle retourne un byte[] non vide demarrant par "%PDF" (magic
 *       bytes PDF). Le renderer est mocke pour eviter de booter Flying Saucer dans le test
 *       unitaire, mais le contrat (filename / content-type) est verifie.</li>
 *   <li>L'audit GENERATE_PDF_ATTESTATION est emis avec le motif RGPD.</li>
 *   <li>Reason absent -&gt; IllegalArgumentException (defense en profondeur cote service,
 *       en plus du 400 controle au niveau controller).</li>
 *   <li>Le rapport de surexposition charge bien le case et appelle GENERATE_PDF_OVEREXPOSURE.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DosimetryReportServiceTest {

    /** Magic bytes d'un PDF (header obligatoire selon ISO 32000-1). */
    private static final byte[] PDF_MAGIC = "%PDF".getBytes(StandardCharsets.US_ASCII);

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DoseRecordRepository doseRecordRepository;

    @Mock
    private DoseCumulativeRepository cumulativeRepository;

    @Mock
    private FitnessAssessmentRepository fitnessRepository;

    @Mock
    private OverexposureCaseRepository caseRepository;

    @Mock
    private HtmlToPdfRenderer pdfRenderer;

    @Mock
    private DosimetryAuditService auditService;

    @Mock
    private RegulatoryLimitResolver regulatoryLimitResolver;

    @InjectMocks
    private DosimetryReportServiceImpl service;

    private byte[] fakePdf;

    @BeforeEach
    void setUp() {
        // Simule un PDF minimal valide : header "%PDF-1.4" + footer "%%EOF"
        String fake = "%PDF-1.4\n%fake-test-content\n%%EOF\n";
        fakePdf = fake.getBytes(StandardCharsets.US_ASCII);
        when(pdfRenderer.render(anyString(), any(Context.class))).thenReturn(fakePdf);
        when(regulatoryLimitResolver.resolveAnnualHp10(anyLong(), any()))
                .thenReturn(Optional.of(20.0));
    }

    private ExposedWorker worker(Long id, Long employeeId, DoseCategory cat, Long mineId) {
        ExposedWorker w = ExposedWorker.builder()
                .id(id)
                .employeeId(employeeId)
                .category(cat)
                .specialStatus(DoseSpecialStatus.NONE)
                .active(true)
                .mineId(mineId)
                .classificationDate(LocalDate.of(2024, 1, 15))
                .build();
        return w;
    }

    private DoseCumulative cumul(Long workerId, int year, Double hp10) {
        return DoseCumulative.builder()
                .workerId(workerId)
                .year(year)
                .annualHp10(hp10)
                .annualHp007(hp10 != null ? hp10 + 1d : null)
                .annualHp3(hp10)
                .rolling5yHp10(hp10 != null ? hp10 * 4d : null)
                .lifetimeHp10(hp10 != null ? hp10 * 8d : null)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // generateIndividualDoseAttestation
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Attestation : retourne un PDF debutant par %PDF + filename + audit")
    void attestation_returns_pdf() {
        ExposedWorker w = worker(7L, 1001L, DoseCategory.A, 1L);
        when(workerRepository.findById(7L)).thenReturn(Optional.of(w));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(7L), eq(2026)))
                .thenReturn(Optional.of(cumul(7L, 2026, 5.5d)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(7L), eq(2025)))
                .thenReturn(Optional.of(cumul(7L, 2025, 4.0d)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(7L), eq(2024)))
                .thenReturn(Optional.empty());
        when(fitnessRepository.findCurrentSigned(7L)).thenReturn(Optional.empty());

        DosimetryReportDocumentDTO doc = service.generateIndividualDoseAttestation(
                7L, 2026, 99L, "Inspection du travail - audit annuel");

        assertThat(doc).isNotNull();
        assertThat(doc.getContent()).isNotEmpty();
        // Magic PDF bytes
        assertThat(java.util.Arrays.copyOfRange(doc.getContent(), 0, 4))
                .isEqualTo(PDF_MAGIC);
        assertThat(doc.getContentType()).isEqualTo("application/pdf");
        assertThat(doc.getFilename()).isEqualTo("attestation_dose_7_2026.pdf");

        verify(auditService).log(eq("GENERATE_PDF_ATTESTATION"), eq("ExposedWorker"),
                eq(7L), eq(99L), eq("DOSIMETRY_READ_NOMINATIVE"),
                eq(null), anyString());
    }

    @Test
    @DisplayName("Attestation : reason vide -> IllegalArgumentException")
    void attestation_blank_reason_throws() {
        assertThatThrownBy(() -> service.generateIndividualDoseAttestation(7L, 2026, 99L, ""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reason");
        verify(workerRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Attestation : reason null -> IllegalArgumentException")
    void attestation_null_reason_throws() {
        assertThatThrownBy(() -> service.generateIndividualDoseAttestation(7L, 2026, 99L, null))
                .isInstanceOf(IllegalArgumentException.class);
        verify(pdfRenderer, never()).render(anyString(), any(Context.class));
    }

    // ────────────────────────────────────────────────────────────────────────
    // generateCareerSummary
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Synthese carriere : PDF + audit GENERATE_PDF_CAREER")
    void career_summary_ok() {
        ExposedWorker w = worker(7L, 1001L, DoseCategory.B, 1L);
        when(workerRepository.findById(7L)).thenReturn(Optional.of(w));
        when(cumulativeRepository.findByWorkerIdOrderByYearDesc(7L))
                .thenReturn(List.of(cumul(7L, 2026, 1.5d), cumul(7L, 2025, 2.0d)));
        when(fitnessRepository.findByWorkerIdOrderByAssessmentDateDesc(7L))
                .thenReturn(List.of());

        DosimetryReportDocumentDTO doc = service.generateCareerSummary(
                7L, 99L, "Demande du travailleur - dossier personnel");

        assertThat(doc.getFilename()).isEqualTo("synthese_carriere_7.pdf");
        assertThat(doc.getContent()).startsWith(PDF_MAGIC);
        verify(auditService).log(eq("GENERATE_PDF_CAREER"), eq("ExposedWorker"),
                eq(7L), eq(99L), eq("DOSIMETRY_READ_NOMINATIVE"),
                eq(null), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // generateAnnualMineRegister
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Registre annuel : PDF + audit GENERATE_PDF_REGISTER, pas de Reason exige")
    void annual_register_ok() {
        when(workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(1L))
                .thenReturn(List.of(worker(7L, 1001L, DoseCategory.A, 1L),
                        worker(8L, 1002L, DoseCategory.B, 1L)));
        when(cumulativeRepository.findByWorkerIdAndYear(anyLong(), eq(2026)))
                .thenReturn(Optional.empty());
        when(fitnessRepository.findCurrentSigned(anyLong()))
                .thenReturn(Optional.empty());

        DosimetryReportDocumentDTO doc = service.generateAnnualMineRegister(1L, 2026, 99L);

        assertThat(doc.getFilename()).isEqualTo("registre_annuel_mine_1_2026.pdf");
        assertThat(doc.getContent()).startsWith(PDF_MAGIC);
        verify(auditService).log(eq("GENERATE_PDF_REGISTER"), eq("Mine"),
                eq(1L), eq(99L), eq("DOSIMETRY_PCR_RPO"), eq(null), anyString());
    }

    @Test
    @DisplayName("AUD-REG-002 : le registre WORKER_B sans limite ne calcule jamais sur 6 mSv")
    void annual_register_workerBWithoutConfiguredLimitDoesNotExposeSix() {
        ExposedWorker workerB = worker(8L, 1002L, DoseCategory.B, 1L);
        when(workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(1L))
                .thenReturn(List.of(workerB));
        when(cumulativeRepository.findByWorkerIdAndYear(8L, 2026))
                .thenReturn(Optional.of(cumul(8L, 2026, 7.0d)));
        when(fitnessRepository.findCurrentSigned(8L)).thenReturn(Optional.empty());
        when(regulatoryLimitResolver.resolveAnnualHp10(1L, KpiCategory.WORKER_B))
                .thenReturn(Optional.empty());

        service.generateAnnualMineRegister(1L, 2026, 99L);

        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        verify(pdfRenderer).render(eq("dosimetry/annual_register"), contextCaptor.capture());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) contextCaptor.getValue()
                .getVariable("rows");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("regulatoryLimit")).isNull();
        assertThat(rows.get(0).get("percentOfLimit")).isNull();
        assertThat(rows.get(0).get("regulatoryLimitConfigured")).isEqualTo(false);
    }

    // ────────────────────────────────────────────────────────────────────────
    // generateOverexposureReport
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Overexposure : PDF + audit GENERATE_PDF_OVEREXPOSURE + reason obligatoire")
    void overexposure_ok() {
        OverexposureCase c = OverexposureCase.builder()
                .id(42L)
                .worker(worker(7L, 1001L, DoseCategory.A, 1L))
                .level(AlertLevel.EXCEEDED)
                .status(CaseStatus.INVESTIGATING)
                .openedAt(LocalDateTime.now())
                .cause("Dosimetre perdu - dose retroactivement attribuee")
                .correctiveActions("Sensibilisation equipe + dotation EPD")
                .medicalDecision("Suivi medical renforce")
                .authorityDeclaration(true)
                .authorityDeclarationDate(LocalDate.now())
                .build();
        when(caseRepository.findById(42L)).thenReturn(Optional.of(c));

        DosimetryReportDocumentDTO doc = service.generateOverexposureReport(
                42L, 99L, "Declaration ASN");

        assertThat(doc.getFilename()).isEqualTo("dossier_surexposition_42.pdf");
        assertThat(doc.getContent()).startsWith(PDF_MAGIC);
        verify(auditService).log(eq("GENERATE_PDF_OVEREXPOSURE"), eq("OverexposureCase"),
                eq(42L), eq(99L), eq("DOSIMETRY_PCR_RPO"), eq(null), anyString());
    }

    @Test
    @DisplayName("Overexposure : reason absent -> IllegalArgumentException")
    void overexposure_blank_reason_throws() {
        assertThatThrownBy(() -> service.generateOverexposureReport(42L, 99L, "  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers (unused fitness mock helper just to satisfy compile)
    // ────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unused")
    private FitnessAssessment fitness(Long id, FitnessLevel level) {
        return FitnessAssessment.builder()
                .id(id)
                .workerId(7L)
                .mineId(1L)
                .assessmentDate(LocalDate.now())
                .validUntil(LocalDate.now().plusYears(1))
                .fitness(level)
                .restrictions("CONFIDENTIEL")
                .publicRestrictionsSummary("ok")
                .physicianId(99L)
                .physicianName("Dr Test")
                .signed(true)
                .build();
    }
}
