package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implementation de {@link RegulatoryExportService}.
 *
 * <p><b>XML :</b> on construit a la main une chaine XML well-formed (un element ROOT, listes
 * d'enfants). Volontairement pas de schema XSD complet : la spec ASN/AIEA evoluant souvent, un
 * mapping rigide casserait avec chaque revision. Le service emet un format simple (cf. tests).
 *
 * <p><b>CSV :</b> RFC 4180 + BOM UTF-8 ({@code 0xEF 0xBB 0xBF}) pour la compatibilite Excel.
 * Les colonnes sont normalisees (snake_case anglais pour cohabiter avec un upload ASN online).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegulatoryExportServiceImpl implements RegulatoryExportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegulatoryExportServiceImpl.class);

    /** BOM UTF-8 standard (Excel-friendly). */
    static final byte[] UTF8_BOM = new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF };

    private final ExposedWorkerRepository workerRepository;
    private final DoseCumulativeRepository cumulativeRepository;
    private final FitnessAssessmentRepository fitnessRepository;
    private final OverexposureCaseRepository caseRepository;
    private final DosimetryAuditService auditService;

    // ============================================================
    //  exportAnnualXmlForAsn
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO exportAnnualXmlForAsn(Long mineId, int year,
            Long requesterId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (year <= 0) {
            year = Year.now().getValue();
        }
        List<ExposedWorker> workers =
                workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(mineId);

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<DosimetryAnnualReport>");
        sb.append("<Header>");
        sb.append("<MineId>").append(mineId).append("</MineId>");
        sb.append("<Year>").append(year).append("</Year>");
        sb.append("<Standard>CIPR-103;AIEA-GSR-Part-3</Standard>");
        sb.append("<WorkersCount>").append(workers.size()).append("</WorkersCount>");
        sb.append("</Header>");
        sb.append("<Workers>");
        for (ExposedWorker w : workers) {
            DoseCumulative cum = cumulativeRepository.findByWorkerIdAndYear(w.getId(), year)
                    .orElse(null);
            String fitness = fitnessRepository.findCurrentSigned(w.getId())
                    .map(FitnessAssessment::getFitness)
                    .map(Enum::name)
                    .orElse("UNKNOWN");
            sb.append("<Worker>");
            sb.append("<WorkerId>").append(w.getId()).append("</WorkerId>");
            sb.append("<EmployeeId>").append(w.getEmployeeId() != null ? w.getEmployeeId() : "")
                    .append("</EmployeeId>");
            sb.append("<Category>").append(w.getCategory() != null ? w.getCategory().name() : "")
                    .append("</Category>");
            sb.append("<SpecialStatus>")
                    .append(w.getSpecialStatus() != null ? w.getSpecialStatus().name() : "NONE")
                    .append("</SpecialStatus>");
            sb.append("<AnnualHp10>").append(xmlNumber(cum != null ? cum.getAnnualHp10() : null))
                    .append("</AnnualHp10>");
            sb.append("<AnnualHp007>").append(xmlNumber(cum != null ? cum.getAnnualHp007() : null))
                    .append("</AnnualHp007>");
            sb.append("<AnnualHp3>").append(xmlNumber(cum != null ? cum.getAnnualHp3() : null))
                    .append("</AnnualHp3>");
            sb.append("<Rolling5yHp10>")
                    .append(xmlNumber(cum != null ? cum.getRolling5yHp10() : null))
                    .append("</Rolling5yHp10>");
            sb.append("<LifetimeHp10>")
                    .append(xmlNumber(cum != null ? cum.getLifetimeHp10() : null))
                    .append("</LifetimeHp10>");
            sb.append("<Fitness>").append(fitness).append("</Fitness>");
            sb.append("</Worker>");
        }
        sb.append("</Workers>");
        sb.append("</DosimetryAnnualReport>");

        byte[] xml = sb.toString().getBytes(StandardCharsets.UTF_8);
        String filename = String.format("asn_annual_%d_%d.xml", mineId, year);

        auditService.log("EXPORT_XML_ASN", "Mine", mineId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, null,
                String.format("{\"year\":%d,\"workersCount\":%d}", year, workers.size()));

        LOGGER.info("[RegulatoryExport] XML ASN exported mineId={} year={} bytes={}",
                mineId, year, xml.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/xml")
                .content(xml)
                .build();
    }

    // ============================================================
    //  exportAnnualCsvForRegulator
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO exportAnnualCsvForRegulator(Long mineId, int year,
            Long requesterId, String format) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (year <= 0) {
            year = Year.now().getValue();
        }
        List<ExposedWorker> workers =
                workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(mineId);

        StringBuilder sb = new StringBuilder();
        // Header normalise - snake_case + unites explicites.
        sb.append("workerId,fullName,category,specialStatus,hp10AnnualMsv,hp007AnnualMsv,"
                + "hp3AnnualMsv,rolling5yHp10Msv,lifetimeHp10Msv,fitness,validUntil\r\n");

        for (ExposedWorker w : workers) {
            DoseCumulative cum = cumulativeRepository.findByWorkerIdAndYear(w.getId(), year)
                    .orElse(null);
            FitnessAssessment current = fitnessRepository.findCurrentSigned(w.getId())
                    .orElse(null);
            String fitnessLabel = current != null && current.getFitness() != null
                    ? current.getFitness().name() : "UNKNOWN";
            String validUntil = current != null && current.getValidUntil() != null
                    ? current.getValidUntil().toString() : "";

            // pas de nominatif RH disponible cote module Dosimetrie - on retourne employeeId
            // dans la colonne fullName pour eviter la confusion. Le module RH ferait un
            // post-enrichissement si la cible reglementaire l'impose.
            String fullName = w.getEmployeeId() != null
                    ? "EMP-" + w.getEmployeeId() : "";

            sb.append(w.getId()).append(',');
            sb.append(csvCell(fullName)).append(',');
            sb.append(csvCell(w.getCategory() != null ? w.getCategory().name() : "")).append(',');
            sb.append(csvCell(w.getSpecialStatus() != null
                    ? w.getSpecialStatus().name() : "NONE")).append(',');
            sb.append(csvNumber(cum != null ? cum.getAnnualHp10() : null)).append(',');
            sb.append(csvNumber(cum != null ? cum.getAnnualHp007() : null)).append(',');
            sb.append(csvNumber(cum != null ? cum.getAnnualHp3() : null)).append(',');
            sb.append(csvNumber(cum != null ? cum.getRolling5yHp10() : null)).append(',');
            sb.append(csvNumber(cum != null ? cum.getLifetimeHp10() : null)).append(',');
            sb.append(csvCell(fitnessLabel)).append(',');
            sb.append(csvCell(validUntil));
            sb.append("\r\n");
        }

        byte[] csvBody = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] payload = new byte[UTF8_BOM.length + csvBody.length];
        System.arraycopy(UTF8_BOM, 0, payload, 0, UTF8_BOM.length);
        System.arraycopy(csvBody, 0, payload, UTF8_BOM.length, csvBody.length);

        String filename = String.format("regulator_annual_%d_%d.csv", mineId, year);

        auditService.log("EXPORT_CSV_REGULATOR", "Mine", mineId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, null,
                String.format("{\"year\":%d,\"workersCount\":%d,\"format\":\"%s\"}",
                        year, workers.size(),
                        format != null ? format.replace("\"", "\\\"") : "default"));

        LOGGER.info("[RegulatoryExport] CSV exported mineId={} year={} bytes={}",
                mineId, year, payload.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("text/csv; charset=utf-8")
                .content(payload)
                .build();
    }

    // ============================================================
    //  exportIncidentsXmlForAsn
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO exportIncidentsXmlForAsn(Long mineId, int year,
            Long requesterId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        if (year <= 0) {
            year = Year.now().getValue();
        }
        // toutes les surexpositions de la mine (actives + cloturees), filtre par annee
        // d'ouverture cote service pour rester schema-friendly.
        List<OverexposureCase> all = caseRepository
                .findActiveByMineId(mineId, List.of(
                        com.minexpert.hns.dosimetry.enums.CaseStatus.OPEN,
                        com.minexpert.hns.dosimetry.enums.CaseStatus.INVESTIGATING,
                        com.minexpert.hns.dosimetry.enums.CaseStatus.CLOSED));
        final int targetYear = year;
        List<OverexposureCase> filtered = all.stream()
                .filter(c -> c.getOpenedAt() != null
                        && c.getOpenedAt().getYear() == targetYear)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<DosimetryIncidentsReport>");
        sb.append("<Header>");
        sb.append("<MineId>").append(mineId).append("</MineId>");
        sb.append("<Year>").append(year).append("</Year>");
        sb.append("<IncidentsCount>").append(filtered.size()).append("</IncidentsCount>");
        sb.append("</Header>");
        sb.append("<Incidents>");
        for (OverexposureCase c : filtered) {
            ExposedWorker w = c.getWorker();
            sb.append("<Incident>");
            sb.append("<CaseId>").append(c.getId()).append("</CaseId>");
            sb.append("<WorkerId>").append(w != null ? w.getId() : "").append("</WorkerId>");
            sb.append("<Level>").append(c.getLevel() != null ? c.getLevel().name() : "")
                    .append("</Level>");
            sb.append("<Status>").append(c.getStatus() != null ? c.getStatus().name() : "")
                    .append("</Status>");
            sb.append("<OpenedAt>").append(c.getOpenedAt() != null ? c.getOpenedAt() : "")
                    .append("</OpenedAt>");
            sb.append("<ClosedAt>").append(c.getClosedAt() != null ? c.getClosedAt() : "")
                    .append("</ClosedAt>");
            sb.append("<AuthorityDeclaration>").append(c.isAuthorityDeclaration())
                    .append("</AuthorityDeclaration>");
            sb.append("<Cause>").append(xmlEscape(c.getCause())).append("</Cause>");
            sb.append("<CorrectiveActions>").append(xmlEscape(c.getCorrectiveActions()))
                    .append("</CorrectiveActions>");
            sb.append("</Incident>");
        }
        sb.append("</Incidents>");
        sb.append("</DosimetryIncidentsReport>");

        byte[] xml = sb.toString().getBytes(StandardCharsets.UTF_8);
        String filename = String.format("asn_incidents_%d_%d.xml", mineId, year);

        auditService.log("EXPORT_INCIDENTS_XML", "Mine", mineId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, null,
                String.format("{\"year\":%d,\"incidentsCount\":%d}", year, filtered.size()));

        LOGGER.info("[RegulatoryExport] Incidents XML exported mineId={} year={} bytes={}",
                mineId, year, xml.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/xml")
                .content(xml)
                .build();
    }

    // ============================================================
    //  Helpers
    // ============================================================

    private long safeUserId(Long id) {
        return id != null ? id : 0L;
    }

    /**
     * Echappe une cellule CSV selon RFC 4180 : si la valeur contient virgule, guillemet ou
     * saut de ligne, on l'entoure de guillemets et on double les guillemets internes.
     */
    static String csvCell(String value) {
        if (value == null) {
            return "";
        }
        boolean mustQuote = value.indexOf(',') >= 0 || value.indexOf('"') >= 0
                || value.indexOf('\n') >= 0 || value.indexOf('\r') >= 0;
        String escaped = value.replace("\"", "\"\"");
        return mustQuote ? "\"" + escaped + "\"" : escaped;
    }

    /**
     * Formate un Double avec 3 decimales (HALF_UP), ou chaine vide si null.
     */
    static String csvNumber(Double d) {
        if (d == null) {
            return "";
        }
        return BigDecimal.valueOf(d).setScale(3, RoundingMode.HALF_UP).toPlainString();
    }

    static String xmlNumber(Double d) {
        if (d == null) {
            return "";
        }
        return BigDecimal.valueOf(d).setScale(3, RoundingMode.HALF_UP).toPlainString();
    }

    /**
     * Echappement XML minimal : &amp; &lt; &gt; &quot; &apos;. Suffisant pour des champs
     * texte libres ASCII / Latin-1.
     */
    static String xmlEscape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
