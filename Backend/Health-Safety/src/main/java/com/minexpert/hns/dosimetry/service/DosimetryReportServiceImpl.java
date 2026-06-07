package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;
import com.minexpert.hns.dosimetry.entity.DoseCumulative;
import com.minexpert.hns.dosimetry.entity.DoseRecord;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.entity.FitnessAssessment;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.DoseCategory;
import com.minexpert.hns.dosimetry.enums.DoseSpecialStatus;
import com.minexpert.hns.dosimetry.enums.KpiCategory;
import com.minexpert.hns.dosimetry.repository.DoseCumulativeRepository;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;
import com.minexpert.hns.dosimetry.repository.FitnessAssessmentRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;
import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation de {@link DosimetryReportService}.
 *
 * <p>Architecture : chaque methode publique
 * <ol>
 *   <li>verifie la presence du motif RGPD si applicable,</li>
 *   <li>charge les donnees (worker + doses + aptitude + cas),</li>
 *   <li>alimente un contexte Thymeleaf (tableaux serialisables),</li>
 *   <li>rend le template puis convertit en PDF,</li>
 *   <li>logge la trace d'audit.</li>
 * </ol>
 *
 * <p>Les limites reglementaires (mSv/an) reproduisent la table de
 * {@link DosimetryAggregationServiceImpl} pour conserver l'absence de couplage entre les deux
 * services.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DosimetryReportServiceImpl implements DosimetryReportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DosimetryReportServiceImpl.class);

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    /** Limites annuelles Hp(10) effectives (mSv) - alignees sur l'aggregation. */
    private static final Map<KpiCategory, Double> REGULATORY_LIMITS = new EnumMap<>(KpiCategory.class);

    static {
        REGULATORY_LIMITS.put(KpiCategory.WORKER_A, 20.0);
        REGULATORY_LIMITS.put(KpiCategory.WORKER_B, 6.0);
        REGULATORY_LIMITS.put(KpiCategory.APPRENTICE, 6.0);
        REGULATORY_LIMITS.put(KpiCategory.PREGNANCY, 1.0);
        REGULATORY_LIMITS.put(KpiCategory.PUBLIC, 1.0);
    }

    private final ExposedWorkerRepository workerRepository;
    private final DoseRecordRepository doseRecordRepository;
    private final DoseCumulativeRepository cumulativeRepository;
    private final FitnessAssessmentRepository fitnessRepository;
    private final OverexposureCaseRepository caseRepository;
    private final HtmlToPdfRenderer pdfRenderer;
    private final DosimetryAuditService auditService;

    // ============================================================
    //  generateIndividualDoseAttestation
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO generateIndividualDoseAttestation(Long workerId, int year,
            Long requesterId, String reason) {
        requireReason(reason, "individual_dose_attestation");
        ExposedWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ExposedWorker not found: " + workerId));

        // Cumuls : annee N et 2 annees precedentes (tableau "doses 3 ans")
        List<Map<String, Object>> annualRows = new ArrayList<>();
        for (int y = year - 2; y <= year; y++) {
            DoseCumulative cum = cumulativeRepository.findByWorkerIdAndYear(workerId, y)
                    .orElse(null);
            KpiCategory kc = mapToKpiCategory(worker);
            Double limit = REGULATORY_LIMITS.get(kc);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("year", y);
            row.put("annualHp10", scale(cum != null ? cum.getAnnualHp10() : null));
            row.put("annualHp007", scale(cum != null ? cum.getAnnualHp007() : null));
            row.put("annualHp3", scale(cum != null ? cum.getAnnualHp3() : null));
            row.put("rolling5yHp10", scale(cum != null ? cum.getRolling5yHp10() : null));
            row.put("lifetimeHp10", scale(cum != null ? cum.getLifetimeHp10() : null));
            row.put("regulatoryLimit", limit);
            row.put("percentOfLimit", percentOfLimit(
                    cum != null ? cum.getAnnualHp10() : null, limit));
            annualRows.add(row);
        }

        // Aptitude courante (signee) - DTO Public-like dans le PDF.
        Optional<FitnessAssessment> currentFit = fitnessRepository.findCurrentSigned(workerId);

        Context ctx = baseContext();
        ctx.setVariable("worker", workerToMap(worker));
        ctx.setVariable("year", year);
        ctx.setVariable("annualRows", annualRows);
        ctx.setVariable("currentYear", year);
        ctx.setVariable("svgPoints", buildSvgPoints(annualRows));
        ctx.setVariable("currentFitness", currentFit.map(this::fitnessToPublicMap).orElse(null));
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", reason);

        byte[] pdf = pdfRenderer.render("dosimetry/attestation_individual", ctx);
        String filename = String.format("attestation_dose_%d_%d.pdf", workerId, year);

        auditService.log("GENERATE_PDF_ATTESTATION", "ExposedWorker", workerId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE, null,
                jsonReason(reason, "year", String.valueOf(year)));

        LOGGER.info("[DosimetryReport] Attestation generated workerId={} year={} bytes={}",
                workerId, year, pdf.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/pdf")
                .content(pdf)
                .build();
    }

    // ============================================================
    //  generateCareerSummary
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO generateCareerSummary(Long workerId, Long requesterId,
            String reason) {
        requireReason(reason, "career_summary");
        ExposedWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ExposedWorker not found: " + workerId));

        // Tous les cumuls annuels (ordonnes recent -> ancien)
        List<DoseCumulative> cumuls = cumulativeRepository.findByWorkerIdOrderByYearDesc(workerId);
        List<Map<String, Object>> cumulRows = new ArrayList<>();
        Double lifetime = null;
        for (DoseCumulative c : cumuls) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("year", c.getYear());
            row.put("annualHp10", scale(c.getAnnualHp10()));
            row.put("annualHp007", scale(c.getAnnualHp007()));
            row.put("annualHp3", scale(c.getAnnualHp3()));
            row.put("rolling5yHp10", scale(c.getRolling5yHp10()));
            row.put("lifetimeHp10", scale(c.getLifetimeHp10()));
            cumulRows.add(row);
            if (c.getLifetimeHp10() != null
                    && (lifetime == null || c.getLifetimeHp10() > lifetime)) {
                lifetime = c.getLifetimeHp10();
            }
        }

        // Historique aptitudes (PUBLIC, pas de cliniques)
        List<FitnessAssessment> fits =
                fitnessRepository.findByWorkerIdOrderByAssessmentDateDesc(workerId);
        List<Map<String, Object>> fitRows = new ArrayList<>();
        for (FitnessAssessment f : fits) {
            fitRows.add(fitnessToPublicMap(f));
        }

        Context ctx = baseContext();
        ctx.setVariable("worker", workerToMap(worker));
        ctx.setVariable("cumulRows", cumulRows);
        ctx.setVariable("fitRows", fitRows);
        ctx.setVariable("lifetime", scale(lifetime));
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", reason);

        byte[] pdf = pdfRenderer.render("dosimetry/career_summary", ctx);
        String filename = String.format("synthese_carriere_%d.pdf", workerId);

        auditService.log("GENERATE_PDF_CAREER", "ExposedWorker", workerId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE, null,
                jsonReason(reason));

        LOGGER.info("[DosimetryReport] Career summary generated workerId={} bytes={}",
                workerId, pdf.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/pdf")
                .content(pdf)
                .build();
    }

    // ============================================================
    //  generateAnnualMineRegister
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO generateAnnualMineRegister(Long mineId, int year,
            Long requesterId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        List<ExposedWorker> workers = workerRepository.findByMineIdAndActiveTrueOrderByEmployeeIdAsc(mineId);

        List<Map<String, Object>> rows = new ArrayList<>();
        long countA = 0;
        long countB = 0;
        long over100 = 0;
        double sum = 0d;
        int withDoses = 0;
        Map<String, Long> fitnessCounts = new HashMap<>();

        for (ExposedWorker w : workers) {
            DoseCumulative cum = cumulativeRepository.findByWorkerIdAndYear(w.getId(), year)
                    .orElse(null);
            KpiCategory kc = mapToKpiCategory(w);
            Double limit = REGULATORY_LIMITS.get(kc);
            Double annual = cum != null ? cum.getAnnualHp10() : null;
            BigDecimal pct = percentOfLimit(annual, limit);

            String fitnessLabel = fitnessRepository.findCurrentSigned(w.getId())
                    .map(f -> f.getFitness().name())
                    .orElse("UNKNOWN");
            fitnessCounts.merge(fitnessLabel, 1L, Long::sum);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("workerId", w.getId());
            row.put("employeeId", w.getEmployeeId());
            row.put("category", w.getCategory() != null ? w.getCategory().name() : "-");
            row.put("kpiCategory", kc.name());
            row.put("annualHp10", scale(annual));
            row.put("regulatoryLimit", limit);
            row.put("percentOfLimit", pct);
            row.put("fitness", fitnessLabel);
            rows.add(row);

            if (w.getCategory() == DoseCategory.A) {
                countA++;
            } else if (w.getCategory() == DoseCategory.B) {
                countB++;
            }
            if (annual != null) {
                sum += annual;
                withDoses++;
            }
            if (pct != null && pct.compareTo(BigDecimal.valueOf(100)) >= 0) {
                over100++;
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWorkers", workers.size());
        stats.put("countA", countA);
        stats.put("countB", countB);
        stats.put("workersOver100Pct", over100);
        stats.put("avgAnnualHp10", withDoses == 0
                ? BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(sum / withDoses).setScale(3, RoundingMode.HALF_UP));
        stats.put("fitnessCounts", fitnessCounts);

        Context ctx = baseContext();
        ctx.setVariable("mineId", mineId);
        ctx.setVariable("year", year);
        ctx.setVariable("rows", rows);
        ctx.setVariable("stats", stats);
        ctx.setVariable("watermark", null);

        byte[] pdf = pdfRenderer.render("dosimetry/annual_register", ctx);
        String filename = String.format("registre_annuel_mine_%d_%d.pdf", mineId, year);

        auditService.log("GENERATE_PDF_REGISTER", "Mine", mineId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, null,
                String.format("{\"year\":%d,\"workersCount\":%d}", year, workers.size()));

        LOGGER.info("[DosimetryReport] Annual register generated mineId={} year={} bytes={}",
                mineId, year, pdf.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/pdf")
                .content(pdf)
                .build();
    }

    // ============================================================
    //  generateOverexposureReport
    // ============================================================

    @Override
    public DosimetryReportDocumentDTO generateOverexposureReport(Long caseId, Long requesterId,
            String reason) {
        requireReason(reason, "overexposure_report");
        OverexposureCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "OverexposureCase not found: " + caseId));
        ExposedWorker worker = c.getWorker();

        Map<String, Object> caseMap = new LinkedHashMap<>();
        caseMap.put("id", c.getId());
        caseMap.put("level", c.getLevel() != null ? c.getLevel().name() : "-");
        caseMap.put("alertId", c.getAlertId());
        caseMap.put("cause", c.getCause());
        caseMap.put("correctiveActions", c.getCorrectiveActions());
        caseMap.put("medicalDecision", c.getMedicalDecision());
        caseMap.put("authorityDeclaration", c.isAuthorityDeclaration());
        caseMap.put("authorityDeclarationDate", formatDate(c.getAuthorityDeclarationDate()));
        caseMap.put("status", c.getStatus() != null ? c.getStatus().name() : "-");
        caseMap.put("openedAt", formatDateTime(c.getOpenedAt()));
        caseMap.put("closedAt", formatDateTime(c.getClosedAt()));

        Context ctx = baseContext();
        ctx.setVariable("worker", worker != null ? workerToMap(worker) : new HashMap<>());
        ctx.setVariable("caseData", caseMap);
        ctx.setVariable("watermark", "CONFIDENTIEL");
        ctx.setVariable("reason", reason);

        byte[] pdf = pdfRenderer.render("dosimetry/overexposure_report", ctx);
        String filename = String.format("dossier_surexposition_%d.pdf", caseId);

        auditService.log("GENERATE_PDF_OVEREXPOSURE", "OverexposureCase", caseId,
                safeUserId(requesterId),
                DosimetryRBACConfig.DOSIMETRY_PCR_RPO, null,
                jsonReason(reason));

        LOGGER.info("[DosimetryReport] Overexposure report generated caseId={} bytes={}",
                caseId, pdf.length);
        return DosimetryReportDocumentDTO.builder()
                .filename(filename)
                .contentType("application/pdf")
                .content(pdf)
                .build();
    }

    // ============================================================
    //  Helpers
    // ============================================================

    private Context baseContext() {
        Context ctx = new Context();
        ctx.setVariable("generatedAt", LocalDateTime.now().format(DATETIME_FORMATTER));
        ctx.setVariable("regulationFootnote",
                "CIPR 103 - AIEA GSR Part 3 - Code du travail R.4451");
        ctx.setVariable("brand", "SafeX 360");
        return ctx;
    }

    private Map<String, Object> workerToMap(ExposedWorker w) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", w.getId());
        out.put("employeeId", w.getEmployeeId());
        out.put("mineId", w.getMineId());
        out.put("category", w.getCategory() != null ? w.getCategory().name() : "-");
        out.put("specialStatus", w.getSpecialStatus() != null ? w.getSpecialStatus().name() : "-");
        out.put("active", w.isActive());
        out.put("classificationDate", formatDate(w.getClassificationDate()));
        out.put("kpiCategory", mapToKpiCategory(w).name());
        return out;
    }

    private Map<String, Object> fitnessToPublicMap(FitnessAssessment f) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", f.getId());
        out.put("fitness", f.getFitness() != null ? f.getFitness().name() : "-");
        out.put("assessmentDate", formatDate(f.getAssessmentDate()));
        out.put("validUntil", formatDate(f.getValidUntil()));
        out.put("reviewRequiredDate", formatDate(f.getReviewRequiredDate()));
        out.put("publicRestrictionsSummary", f.getPublicRestrictionsSummary());
        out.put("signed", f.isSigned());
        out.put("physicianName", f.getPhysicianName());
        return out;
    }

    /**
     * Construit une chaine "x1,y1 x2,y2 ..." prete a etre injectee dans une &lt;polyline&gt;
     * SVG decrivant l'evolution des doses annuelles (Hp10) sur les 3 dernieres annees.
     * Le viewport SVG est suppose 300x100 ; on normalise par rapport a la max locale + 5%.
     */
    private String buildSvgPoints(List<Map<String, Object>> annualRows) {
        if (annualRows == null || annualRows.isEmpty()) {
            return "";
        }
        double max = 0d;
        for (Map<String, Object> row : annualRows) {
            Object v = row.get("annualHp10");
            if (v instanceof BigDecimal) {
                double d = ((BigDecimal) v).doubleValue();
                if (d > max) {
                    max = d;
                }
            }
        }
        if (max <= 0d) {
            max = 1d;
        }
        double margin = max * 1.05d;
        StringBuilder sb = new StringBuilder();
        int n = annualRows.size();
        double width = 300d;
        double height = 100d;
        for (int i = 0; i < n; i++) {
            double x = n == 1 ? width / 2d : (i * (width / (n - 1d)));
            Object v = annualRows.get(i).get("annualHp10");
            double dose = v instanceof BigDecimal ? ((BigDecimal) v).doubleValue() : 0d;
            double y = height - (dose / margin) * height;
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(String.format(java.util.Locale.ROOT, "%.2f,%.2f", x, y));
        }
        return sb.toString();
    }

    private void requireReason(String reason, String context) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException(
                    "RGPD reason is required for " + context + " (header X-Reason)");
        }
    }

    private long safeUserId(Long id) {
        return id != null ? id : 0L;
    }

    private String jsonReason(String reason, String... extras) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"reason\":\"").append(escapeJson(reason)).append('"');
        for (int i = 0; i + 1 < extras.length; i += 2) {
            sb.append(",\"").append(extras[i]).append("\":\"")
                    .append(escapeJson(extras[i + 1])).append('"');
        }
        sb.append('}');
        return sb.toString();
    }

    private String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }

    private BigDecimal scale(Double d) {
        if (d == null) {
            return null;
        }
        return BigDecimal.valueOf(d).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal percentOfLimit(Double dose, Double limit) {
        if (dose == null || limit == null || limit <= 0d) {
            return null;
        }
        return BigDecimal.valueOf(dose * 100d / limit).setScale(1, RoundingMode.HALF_UP);
    }

    private String formatDate(LocalDate d) {
        return d != null ? d.format(DATE_FORMATTER) : "";
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(DATETIME_FORMATTER) : "";
    }

    /**
     * Reproduit la regle de classification de
     * {@link DosimetryAggregationServiceImpl#mapToKpiCategory(ExposedWorker)} : PREGNANCY et
     * APPRENTICE l'emportent sur A/B.
     */
    static KpiCategory mapToKpiCategory(ExposedWorker w) {
        DoseSpecialStatus ss = w.getSpecialStatus();
        if (ss == DoseSpecialStatus.PREGNANCY) {
            return KpiCategory.PREGNANCY;
        }
        if (ss == DoseSpecialStatus.APPRENTICE) {
            return KpiCategory.APPRENTICE;
        }
        DoseCategory cat = w.getCategory();
        if (cat == DoseCategory.A) {
            return KpiCategory.WORKER_A;
        }
        if (cat == DoseCategory.B) {
            return KpiCategory.WORKER_B;
        }
        return KpiCategory.PUBLIC;
    }

    /** Utilisateur du dose record (placeholder pour API future). */
    @SuppressWarnings("unused")
    private List<DoseRecord> activeRecordsForYear(Long workerId, int year) {
        return doseRecordRepository.findActiveByWorkerIdAndYear(workerId, String.valueOf(year));
    }

    /** Sort liste de map par cle (utilise pour debug). */
    @SuppressWarnings("unused")
    private void sortMapsByKey(List<Map<String, Object>> rows, String key) {
        rows.sort(Comparator.comparing(r -> String.valueOf(r.get(key))));
    }
}
