package com.minexpert.hns.blast.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import com.minexpert.hns.api.emergency.entity.EvacuationCheckIn;
import com.minexpert.hns.api.emergency.entity.GeneralAlert;
import com.minexpert.hns.api.emergency.enums.CheckInStatus;
import com.minexpert.hns.api.emergency.enums.GeneralAlertStatus;
import com.minexpert.hns.api.emergency.repository.EvacuationCheckInRepository;
import com.minexpert.hns.api.emergency.repository.GeneralAlertRepository;
import com.minexpert.hns.blast.dto.BlastEvacuationReportDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastEvacuationReport;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastEvacuationReportRepository;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastStatusEventRepository;
import com.minexpert.hns.dosimetry.util.HtmlToPdfRenderer;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation par defaut de {@link BlastEvacuationReportService} (P6).
 *
 * <p>Toutes les ecritures sont en transaction unique. La signature ferme
 * applicativement la liste des incidents : toute mutation ulterieure est
 * rejetee par {@link #assertNotSigned(BlastEvacuationReport)}. Cote BDD,
 * les triggers V018 verrouillent les memes colonnes au niveau SQL.
 */
@Service
@Transactional
public class BlastEvacuationReportServiceImpl implements BlastEvacuationReportService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(BlastEvacuationReportServiceImpl.class);

    private static final DateTimeFormatter INCIDENT_TS_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final BlastEvacuationReportRepository reportRepository;
    private final BlastRepository blastRepository;
    private final BlastStatusEventRepository statusEventRepository;
    private final BlastNotificationJobRepository jobRepository;
    private final GeneralAlertRepository generalAlertRepository;
    private final EvacuationCheckInRepository checkInRepository;
    private final HtmlToPdfRenderer pdfRenderer;

    public BlastEvacuationReportServiceImpl(
            BlastEvacuationReportRepository reportRepository,
            BlastRepository blastRepository,
            BlastStatusEventRepository statusEventRepository,
            BlastNotificationJobRepository jobRepository,
            @Autowired(required = false) GeneralAlertRepository generalAlertRepository,
            @Autowired(required = false) EvacuationCheckInRepository checkInRepository,
            HtmlToPdfRenderer pdfRenderer) {
        this.reportRepository = reportRepository;
        this.blastRepository = blastRepository;
        this.statusEventRepository = statusEventRepository;
        this.jobRepository = jobRepository;
        this.generalAlertRepository = generalAlertRepository;
        this.checkInRepository = checkInRepository;
        this.pdfRenderer = pdfRenderer;
    }

    // ── Create (auto a ALL_CLEAR) ─────────────────────────────────────────

    @Override
    public BlastEvacuationReportDTO createReport(Long blastId) {
        if (blastId == null) {
            throw new IllegalArgumentException("blastId is required");
        }
        Optional<BlastEvacuationReport> existing = reportRepository.findByBlastId(blastId);
        if (existing.isPresent()) {
            LOGGER.debug("[EvacReport] createReport({}) — already exists, idempotent no-op", blastId);
            return toDto(existing.get(), blastRepository.findById(blastId).orElse(null));
        }

        Blast blast = blastRepository.findById(blastId)
                .orElseThrow(() -> new EntityNotFoundException("Blast not found: " + blastId));

        List<BlastStatusEvent> events =
                statusEventRepository.findByBlastIdOrderByAtDesc(blastId);

        LocalDateTime alarmTriggeredAt = resolveAlarmTriggeredAt(blastId, events);
        LocalDateTime firedAt = resolveTransitionTimestamp(events, BlastStatus.FIRED);
        LocalDateTime allClearAt = resolveTransitionTimestamp(events, BlastStatus.ALL_CLEAR);

        // Head-count : reuse Emergency service via repos directs.
        HeadCount counts = computeHeadCount(blast, alarmTriggeredAt, allClearAt);

        Integer evacDurationSeconds = null;
        if (alarmTriggeredAt != null && firedAt != null) {
            long seconds = Duration.between(alarmTriggeredAt, firedAt).getSeconds();
            // Defense : ne stocke pas une duree negative (cas pathologique).
            evacDurationSeconds = seconds < 0 ? 0 : (int) seconds;
        }

        BlastEvacuationReport report = BlastEvacuationReport.builder()
                .blastId(blastId)
                .alarmTriggeredAt(alarmTriggeredAt)
                .firedAt(firedAt)
                .allClearAt(allClearAt)
                .musteredCount(counts.mustered)
                .missingCount(counts.missing)
                .evacDurationSeconds(evacDurationSeconds)
                .incidents("") // liste vide initialement
                .build();

        BlastEvacuationReport saved = reportRepository.save(report);
        LOGGER.info("[EvacReport] Created for blastId={} reportId={} mustered={} missing={} evacSec={}",
                blastId, saved.getId(), saved.getMusteredCount(), saved.getMissingCount(),
                saved.getEvacDurationSeconds());
        return toDto(saved, blast);
    }

    // ── Sign ──────────────────────────────────────────────────────────────

    @Override
    public BlastEvacuationReportDTO sign(Long reportId, Long signedByUserId, String signatureDataBase64) {
        BlastEvacuationReport report = loadOrThrow(reportId);
        assertNotSigned(report);

        // Concat optionnelle de l'empreinte canvas en bas d'incidents avec un
        // marqueur reconnaissable — preserve la valeur juridique des champs
        // signedOffBy / signedAt qui sont les seuls champs reconnus en audit.
        if (signatureDataBase64 != null && !signatureDataBase64.isBlank()) {
            String existing = report.getIncidents() == null ? "" : report.getIncidents();
            String separator = existing.isEmpty() ? "" : "\n";
            report.setIncidents(existing + separator + "[SIG_DATA_URL]:" + signatureDataBase64);
        }

        report.setSignedOffBy(signedByUserId);
        report.setSignedAt(LocalDateTime.now());

        BlastEvacuationReport saved = reportRepository.save(report);
        LOGGER.info("[EvacReport] Signed reportId={} by userId={}", reportId, signedByUserId);
        return toDto(saved, blastRepository.findById(report.getBlastId()).orElse(null));
    }

    // ── Add incident (append-only) ───────────────────────────────────────

    @Override
    public BlastEvacuationReportDTO addIncident(Long reportId, String incidentDescription, Long actorId) {
        if (incidentDescription == null || incidentDescription.isBlank()) {
            throw new IllegalArgumentException("incidentDescription is required");
        }
        BlastEvacuationReport report = loadOrThrow(reportId);
        assertNotSigned(report);

        String prefix = String.format("[%s][user=%s] ",
                LocalDateTime.now().format(INCIDENT_TS_FORMATTER),
                actorId == null ? "?" : actorId.toString());
        String existing = report.getIncidents() == null ? "" : report.getIncidents();
        String separator = existing.isEmpty() ? "" : "\n";
        report.setIncidents(existing + separator + prefix + incidentDescription.trim());

        BlastEvacuationReport saved = reportRepository.save(report);
        LOGGER.info("[EvacReport] Incident added reportId={} actorId={} length={}",
                reportId, actorId, incidentDescription.length());
        return toDto(saved, blastRepository.findById(report.getBlastId()).orElse(null));
    }

    // ── Reads ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Optional<BlastEvacuationReportDTO> getByBlastId(Long blastId) {
        return reportRepository.findByBlastId(blastId)
                .map(r -> toDto(r, blastRepository.findById(r.getBlastId()).orElse(null)));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BlastEvacuationReportDTO> getById(Long reportId) {
        return reportRepository.findById(reportId)
                .map(r -> toDto(r, blastRepository.findById(r.getBlastId()).orElse(null)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlastEvacuationReportDTO> search(Long mineId) {
        if (mineId == null) {
            throw new IllegalArgumentException("mineId is required");
        }
        // Liste tous les rapports puis filtre par mineId (le volume reste
        // raisonnable : un rapport par tir ALL_CLEAR, qq dizaines par mois).
        return reportRepository.findAll().stream()
                .map(r -> {
                    Blast b = blastRepository.findById(r.getBlastId()).orElse(null);
                    return b != null && mineId.equals(b.getMineId()) ? toDto(r, b) : null;
                })
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(
                        BlastEvacuationReportDTO::getAllClearAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    // ── PDF render ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] renderPdf(Long reportId, String lang) {
        BlastEvacuationReport report = loadOrThrow(reportId);
        Blast blast = blastRepository.findById(report.getBlastId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Blast not found: " + report.getBlastId()));

        String resolvedLang = (lang != null && lang.equalsIgnoreCase("en")) ? "en" : "fr";

        Context ctx = new Context();
        ctx.setVariable("brand", "SafeX 360");
        ctx.setVariable("lang", resolvedLang);
        ctx.setVariable("generatedAt",
                LocalDateTime.now().format(INCIDENT_TS_FORMATTER));
        ctx.setVariable("isEnglish", "en".equals(resolvedLang));

        ctx.setVariable("blast", blastToMap(blast));
        ctx.setVariable("report", reportToMap(report));
        ctx.setVariable("incidents", parseIncidentsForRendering(report.getIncidents()));
        ctx.setVariable("signed", report.getSignedAt() != null);

        byte[] pdf = pdfRenderer.render("blast/evacuation_report", ctx);
        LOGGER.info("[EvacReport] PDF rendered reportId={} lang={} bytes={}",
                reportId, resolvedLang, pdf.length);
        return pdf;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private BlastEvacuationReport loadOrThrow(Long reportId) {
        if (reportId == null) {
            throw new IllegalArgumentException("reportId is required");
        }
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "BlastEvacuationReport not found: " + reportId));
    }

    private void assertNotSigned(BlastEvacuationReport report) {
        if (report.getSignedAt() != null) {
            throw new IllegalStateException(
                    "Blast evacuation report " + report.getId()
                            + " is already signed (signedAt=" + report.getSignedAt()
                            + ") — incidents / counts are now read-only.");
        }
    }

    /**
     * Resout l'horodatage de declenchement de l'alarme generale.
     *
     * <p>Priorite (du plus precis au plus large) :
     * <ol>
     *   <li>{@code BlastNotificationJob.sentAt} pour le job
     *       {@link JobType#GENERAL_ALARM_10M} en statut {@code SENT} ;</li>
     *   <li>{@code BlastStatusEvent.at} pour la transition CONFIRMED → IMMINENT
     *       (cf. cahier des charges : l'alerte declenche le passage IMMINENT) ;</li>
     *   <li>{@code null} si aucune source fiable n'est disponible (cas tirs
     *       avances manuellement ou ratés sans alarme).</li>
     * </ol>
     */
    private LocalDateTime resolveAlarmTriggeredAt(Long blastId, List<BlastStatusEvent> events) {
        List<BlastNotificationJob> alarmJobs =
                jobRepository.findByBlastIdAndType(blastId, JobType.GENERAL_ALARM_10M);
        for (BlastNotificationJob j : alarmJobs) {
            if (j.getStatus() == JobStatus.SENT && j.getSentAt() != null) {
                return j.getSentAt();
            }
        }
        for (BlastStatusEvent e : events) {
            if (e.getToStatus() == BlastStatus.IMMINENT
                    && e.getFromStatus() == BlastStatus.CONFIRMED) {
                return e.getAt();
            }
        }
        return null;
    }

    /**
     * Recupere l'horodatage de la premiere transition vers le statut cible
     * dans l'historique APPEND-ONLY ({@code blast_status_event}).
     */
    private LocalDateTime resolveTransitionTimestamp(List<BlastStatusEvent> events,
                                                     BlastStatus targetStatus) {
        // L'historique est trie DESC ; on prend le dernier en date (en cas de
        // boucles MISFIRE -> ALL_CLEAR partielles, le plus recent fait foi).
        for (BlastStatusEvent e : events) {
            if (e.getToStatus() == targetStatus) {
                return e.getAt();
            }
        }
        return null;
    }

    /**
     * Calcule {@code (mustered, missing)} en reutilisant le service
     * Emergency : on cherche l'Alerte Generale qui couvre le creneau du tir
     * et on compte les check-ins SAFE / INJURED (presents) vs MISSING.
     *
     * <p>Si aucun module Emergency n'est cable (ex. tests unitaires ou
     * deploiement minimaliste), les comptages retombent silencieusement a
     * {@code (0, 0)} — le rapport reste valide mais incomplet.
     */
    private HeadCount computeHeadCount(Blast blast,
                                       LocalDateTime alarmTriggeredAt,
                                       LocalDateTime allClearAt) {
        if (generalAlertRepository == null || checkInRepository == null) {
            return new HeadCount(0, 0);
        }
        try {
            // Cherche les alertes de la mine, du plus recent au plus ancien.
            List<GeneralAlert> alerts = generalAlertRepository
                    .findByCompanyIdOrderByTriggeredAtDesc(blast.getMineId());
            GeneralAlert matching = null;
            for (GeneralAlert a : alerts) {
                if (intersectsBlastWindow(a, alarmTriggeredAt, allClearAt)) {
                    matching = a;
                    break;
                }
            }
            if (matching == null) {
                // Pas d'alerte rattachee : on ne peut pas comptabiliser.
                return new HeadCount(0, 0);
            }
            List<EvacuationCheckIn> checkIns = checkInRepository
                    .findByGeneralAlertIdOrderByCheckedAtDesc(matching.getId());
            int mustered = 0;
            int missing = 0;
            for (EvacuationCheckIn c : checkIns) {
                if (c.getStatus() == CheckInStatus.MISSING) {
                    missing++;
                } else {
                    mustered++;
                }
            }
            return new HeadCount(mustered, missing);
        } catch (Exception ex) {
            LOGGER.warn("[EvacReport] head-count fallback (0,0) for blastId={} : {}",
                    blast.getId(), ex.getMessage());
            return new HeadCount(0, 0);
        }
    }

    private boolean intersectsBlastWindow(GeneralAlert a,
                                          LocalDateTime alarmTriggeredAt,
                                          LocalDateTime allClearAt) {
        if (a.getTriggeredAt() == null) return false;
        LocalDateTime start = alarmTriggeredAt;
        LocalDateTime end = allClearAt != null ? allClearAt : LocalDateTime.now();
        if (start == null) return false;
        LocalDateTime alertStart = a.getTriggeredAt();
        LocalDateTime alertEnd = a.getEndedAt() != null ? a.getEndedAt() : LocalDateTime.now();
        // Statut ACTIVE / ENDED tous deux pertinents tant que la fenetre
        // temporelle couvre celle du tir.
        if (a.getStatus() == null) return false;
        if (a.getStatus() != GeneralAlertStatus.ACTIVE
                && a.getStatus() != GeneralAlertStatus.ENDED) {
            return false;
        }
        // Intersection [alertStart, alertEnd] ∩ [start, end] non vide.
        return !alertEnd.isBefore(start) && !alertStart.isAfter(end);
    }

    private BlastEvacuationReportDTO toDto(BlastEvacuationReport r, Blast blast) {
        return BlastEvacuationReportDTO.builder()
                .id(r.getId())
                .blastId(r.getBlastId())
                .blastReference(blast != null ? blast.getReference() : null)
                .blastScheduledAt(blast != null ? blast.getScheduledAt() : null)
                .blastTimezone(blast != null ? blast.getTimezone() : null)
                .alarmZoneScope(blast != null ? blast.getAlarmZoneScope() : null)
                .assemblyPoints(blast != null ? blast.getAssemblyPoints() : null)
                .alarmTriggeredAt(r.getAlarmTriggeredAt())
                .musteredCount(r.getMusteredCount())
                .missingCount(r.getMissingCount())
                .evacDurationSeconds(r.getEvacDurationSeconds())
                .firedAt(r.getFiredAt())
                .allClearAt(r.getAllClearAt())
                .incidents(r.getIncidents())
                .signedOffBy(r.getSignedOffBy())
                .signedAt(r.getSignedAt())
                .signed(r.getSignedAt() != null)
                .build();
    }

    private Map<String, Object> blastToMap(Blast b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("reference", b.getReference());
        m.put("scheduledAt", formatDt(b.getScheduledAt()));
        m.put("timezone", nvl(b.getTimezone()));
        m.put("pit", nvl(b.getPit()));
        m.put("bench", nvl(b.getBench()));
        m.put("block", nvl(b.getBlock()));
        m.put("type", b.getType() != null ? b.getType().name() : "-");
        m.put("alarmZoneScope", nvl(b.getAlarmZoneScope()));
        m.put("assemblyPoints", nvl(b.getAssemblyPoints()));
        m.put("exclusionRadiusM", b.getExclusionRadiusM());
        m.put("blasterId", b.getBlasterId());
        m.put("hseLeadId", b.getHseLeadId());
        m.put("mineId", b.getMineId());
        return m;
    }

    private Map<String, Object> reportToMap(BlastEvacuationReport r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("alarmTriggeredAt", formatDt(r.getAlarmTriggeredAt()));
        m.put("firedAt", formatDt(r.getFiredAt()));
        m.put("allClearAt", formatDt(r.getAllClearAt()));
        m.put("musteredCount", r.getMusteredCount() == null ? 0 : r.getMusteredCount());
        m.put("missingCount", r.getMissingCount() == null ? 0 : r.getMissingCount());
        m.put("evacDurationSeconds",
                r.getEvacDurationSeconds() == null ? 0 : r.getEvacDurationSeconds());
        m.put("evacDurationHuman", humanDuration(r.getEvacDurationSeconds()));
        m.put("signedOffBy", r.getSignedOffBy());
        m.put("signedAt", formatDt(r.getSignedAt()));
        return m;
    }

    private List<String> parseIncidentsForRendering(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        List<String> out = new ArrayList<>();
        for (String line : raw.split("\n")) {
            String trimmed = line.trim();
            // Ne pas afficher la signature graphique brute dans la liste
            // d'incidents : trop volumineuse, image embarquee separement.
            if (trimmed.isEmpty() || trimmed.startsWith("[SIG_DATA_URL]:")) {
                continue;
            }
            out.add(trimmed);
        }
        return out;
    }

    private String humanDuration(Integer seconds) {
        if (seconds == null || seconds <= 0) return "-";
        long s = seconds;
        long h = s / 3600;
        long m = (s % 3600) / 60;
        long sec = s % 60;
        StringBuilder sb = new StringBuilder();
        if (h > 0) sb.append(h).append("h ");
        if (m > 0 || h > 0) sb.append(m).append("min ");
        sb.append(sec).append("s");
        return sb.toString();
    }

    private String formatDt(LocalDateTime t) {
        return t == null ? "-" : t.format(INCIDENT_TS_FORMATTER);
    }

    private String nvl(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }

    /** Compteur immutable {@code (mustered, missing)} pour le head-count. */
    private static final class HeadCount {
        final int mustered;
        final int missing;
        HeadCount(int mustered, int missing) {
            this.mustered = mustered;
            this.missing = missing;
        }
    }
}
