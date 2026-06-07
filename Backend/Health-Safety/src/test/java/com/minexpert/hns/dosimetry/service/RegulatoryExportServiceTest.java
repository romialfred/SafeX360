package com.minexpert.hns.dosimetry.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.w3c.dom.Document;

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
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

/**
 * Tests unitaires de {@link RegulatoryExportServiceImpl} (Phase 9).
 *
 * <p>Verifie :
 * <ul>
 *   <li>XML annuel : well-formed (parsable JAXP), root element correct, un Worker par
 *       travailleur, header avec mineId et year.</li>
 *   <li>CSV annuel : BOM UTF-8 en debut de payload, header avec colonnes attendues, 1 ligne
 *       de donnees par worker.</li>
 *   <li>XML incidents : well-formed et filtre par annee d'ouverture.</li>
 *   <li>CSV : echappement RFC 4180 sur les caracteres reserves.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegulatoryExportServiceTest {

    @Mock
    private ExposedWorkerRepository workerRepository;

    @Mock
    private DoseCumulativeRepository cumulativeRepository;

    @Mock
    private FitnessAssessmentRepository fitnessRepository;

    @Mock
    private OverexposureCaseRepository caseRepository;

    @Mock
    private DosimetryAuditService auditService;

    @InjectMocks
    private RegulatoryExportServiceImpl service;

    private ExposedWorker worker(Long id, Long employeeId, DoseCategory cat, Long mineId) {
        return ExposedWorker.builder()
                .id(id)
                .employeeId(employeeId)
                .category(cat)
                .specialStatus(DoseSpecialStatus.NONE)
                .active(true)
                .mineId(mineId)
                .build();
    }

    private DoseCumulative cumul(Long workerId, int year, Double hp10) {
        return DoseCumulative.builder()
                .workerId(workerId)
                .year(year)
                .annualHp10(hp10)
                .annualHp007(hp10)
                .annualHp3(hp10)
                .rolling5yHp10(hp10 != null ? hp10 * 3d : null)
                .lifetimeHp10(hp10 != null ? hp10 * 6d : null)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private FitnessAssessment fitness(Long workerId, FitnessLevel level) {
        return FitnessAssessment.builder()
                .id(100L + workerId)
                .workerId(workerId)
                .mineId(1L)
                .assessmentDate(LocalDate.now())
                .validUntil(LocalDate.now().plusYears(1))
                .fitness(level)
                .signed(true)
                .physicianId(99L)
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // XML annuel
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("XML annuel : well-formed + 2 workers + audit EXPORT_XML_ASN")
    void annual_xml_well_formed() throws Exception {
        when(workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(1L))
                .thenReturn(List.of(
                        worker(7L, 1001L, DoseCategory.A, 1L),
                        worker(8L, 1002L, DoseCategory.B, 1L)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(7L), eq(2026)))
                .thenReturn(Optional.of(cumul(7L, 2026, 5.4321d)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(8L), eq(2026)))
                .thenReturn(Optional.of(cumul(8L, 2026, 1.111d)));
        when(fitnessRepository.findCurrentSigned(7L))
                .thenReturn(Optional.of(fitness(7L, FitnessLevel.FIT)));
        when(fitnessRepository.findCurrentSigned(8L))
                .thenReturn(Optional.of(fitness(8L, FitnessLevel.FIT_WITH_RESTRICTIONS)));

        DosimetryReportDocumentDTO doc = service.exportAnnualXmlForAsn(1L, 2026, 42L);

        assertThat(doc.getContentType()).isEqualTo("application/xml");
        assertThat(doc.getFilename()).isEqualTo("asn_annual_1_2026.xml");
        String xml = new String(doc.getContent(), StandardCharsets.UTF_8);
        assertThat(xml).startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        // Parse JAXP pour valider well-formed
        Document parsed = parseXml(doc.getContent());
        assertThat(parsed.getDocumentElement().getNodeName())
                .isEqualTo("DosimetryAnnualReport");
        assertThat(parsed.getElementsByTagName("Worker").getLength()).isEqualTo(2);
        assertThat(parsed.getElementsByTagName("WorkersCount").item(0).getTextContent())
                .isEqualTo("2");
        assertThat(xml).contains("<MineId>1</MineId>");
        assertThat(xml).contains("<Year>2026</Year>");

        // audit
        verify_audit_call("EXPORT_XML_ASN", "Mine", 1L, 42L);
    }

    @Test
    @DisplayName("XML annuel : mineId null -> IllegalArgumentException")
    void annual_xml_mineId_null() {
        assertThatThrownBy(() -> service.exportAnnualXmlForAsn(null, 2026, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // CSV annuel
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("CSV : BOM UTF-8 + header normalise + 1 ligne par worker + audit")
    void csv_with_bom_and_header() {
        when(workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(1L))
                .thenReturn(List.of(
                        worker(7L, 1001L, DoseCategory.A, 1L),
                        worker(8L, 1002L, DoseCategory.B, 1L)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(7L), eq(2026)))
                .thenReturn(Optional.of(cumul(7L, 2026, 5.5d)));
        when(cumulativeRepository.findByWorkerIdAndYear(eq(8L), eq(2026)))
                .thenReturn(Optional.empty());
        when(fitnessRepository.findCurrentSigned(anyLong()))
                .thenReturn(Optional.empty());

        DosimetryReportDocumentDTO doc = service.exportAnnualCsvForRegulator(
                1L, 2026, 42L, "ASN_V1");

        assertThat(doc.getContentType()).isEqualTo("text/csv; charset=utf-8");
        assertThat(doc.getFilename()).isEqualTo("regulator_annual_1_2026.csv");
        byte[] content = doc.getContent();

        // BOM UTF-8 prefixe : 0xEF 0xBB 0xBF
        assertThat(content[0] & 0xFF).isEqualTo(0xEF);
        assertThat(content[1] & 0xFF).isEqualTo(0xBB);
        assertThat(content[2] & 0xFF).isEqualTo(0xBF);

        String csv = new String(content, 3, content.length - 3, StandardCharsets.UTF_8);
        // Header
        assertThat(csv).startsWith("workerId,fullName,category,specialStatus,hp10AnnualMsv,"
                + "hp007AnnualMsv,hp3AnnualMsv,rolling5yHp10Msv,lifetimeHp10Msv,fitness,validUntil");
        // 1 ligne par worker (header + 2 = 3 lignes non-vides)
        long nonEmptyLines = csv.lines().filter(l -> !l.isBlank()).count();
        assertThat(nonEmptyLines).isEqualTo(3L);
        // Worker 7 doit avoir 5.500 mSv (3 decimales HALF_UP)
        assertThat(csv).contains("5.500");

        verify_audit_call("EXPORT_CSV_REGULATOR", "Mine", 1L, 42L);
    }

    @Test
    @DisplayName("csvCell : echappement RFC 4180 sur , et \" et saut de ligne")
    void csv_escape_special_chars() {
        // Acces public au helper static via la meme classe.
        assertThat(RegulatoryExportServiceImpl.csvCell("simple"))
                .isEqualTo("simple");
        assertThat(RegulatoryExportServiceImpl.csvCell("a,b"))
                .isEqualTo("\"a,b\"");
        assertThat(RegulatoryExportServiceImpl.csvCell("with \"quote\""))
                .isEqualTo("\"with \"\"quote\"\"\"");
        assertThat(RegulatoryExportServiceImpl.csvCell("line1\nline2"))
                .isEqualTo("\"line1\nline2\"");
        assertThat(RegulatoryExportServiceImpl.csvCell(null)).isEmpty();
    }

    @Test
    @DisplayName("csvNumber : 3 decimales HALF_UP, vide si null")
    void csv_number_formatting() {
        assertThat(RegulatoryExportServiceImpl.csvNumber(null)).isEmpty();
        assertThat(RegulatoryExportServiceImpl.csvNumber(0d)).isEqualTo("0.000");
        assertThat(RegulatoryExportServiceImpl.csvNumber(1.2345d)).isEqualTo("1.235");
    }

    // ────────────────────────────────────────────────────────────────────────
    // XML incidents
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("XML incidents : well-formed + filtre par annee d'ouverture + audit")
    void incidents_xml_well_formed_and_filtered() throws Exception {
        OverexposureCase c2026 = OverexposureCase.builder()
                .id(50L)
                .worker(worker(7L, 1001L, DoseCategory.A, 1L))
                .level(AlertLevel.EXCEEDED)
                .status(CaseStatus.CLOSED)
                .openedAt(LocalDateTime.of(2026, 5, 10, 14, 0))
                .closedAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .cause("Cas a inclure")
                .authorityDeclaration(true)
                .build();
        OverexposureCase c2025 = OverexposureCase.builder()
                .id(51L)
                .worker(worker(7L, 1001L, DoseCategory.A, 1L))
                .level(AlertLevel.ACTION)
                .status(CaseStatus.CLOSED)
                .openedAt(LocalDateTime.of(2025, 12, 20, 10, 0))
                .cause("Cas 2025 a exclure")
                .build();
        when(caseRepository.findActiveByMineId(eq(1L), any()))
                .thenReturn(List.of(c2026, c2025));

        DosimetryReportDocumentDTO doc = service.exportIncidentsXmlForAsn(1L, 2026, 42L);

        assertThat(doc.getContentType()).isEqualTo("application/xml");
        assertThat(doc.getFilename()).isEqualTo("asn_incidents_1_2026.xml");

        Document parsed = parseXml(doc.getContent());
        assertThat(parsed.getDocumentElement().getNodeName())
                .isEqualTo("DosimetryIncidentsReport");
        // 2025 doit etre filtre - 1 seul Incident
        assertThat(parsed.getElementsByTagName("Incident").getLength()).isEqualTo(1);
        assertThat(parsed.getElementsByTagName("IncidentsCount").item(0).getTextContent())
                .isEqualTo("1");

        verify_audit_call("EXPORT_INCIDENTS_XML", "Mine", 1L, 42L);
    }

    @Test
    @DisplayName("xmlEscape : echappe & < > \" '")
    void xml_escape() {
        assertThat(RegulatoryExportServiceImpl.xmlEscape("a & b < c > d \" e ' f"))
                .isEqualTo("a &amp; b &lt; c &gt; d &quot; e &apos; f");
        assertThat(RegulatoryExportServiceImpl.xmlEscape(null)).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // helpers
    // ────────────────────────────────────────────────────────────────────────

    private Document parseXml(byte[] content) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        // Hardening : pas de DTD externe ni d'entites externes.
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = dbf.newDocumentBuilder();
        return builder.parse(new ByteArrayInputStream(content));
    }

    private void verify_audit_call(String action, String entityType, long entityId, long userId) {
        org.mockito.Mockito.verify(auditService).log(
                eq(action), eq(entityType), eq(entityId), eq(userId),
                eq("DOSIMETRY_PCR_RPO"),
                eq(null),
                org.mockito.ArgumentMatchers.anyString());
    }
}
