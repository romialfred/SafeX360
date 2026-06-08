package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastEmailLog;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastRecipient;
import com.minexpert.hns.blast.entity.BlastSetting;
import com.minexpert.hns.blast.enums.EmailLogStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastEmailLogRepository;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastSettingRepository;
import com.minexpert.hns.service.communications.MessageSender;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Service d'envoi des e-mails de rappel de tir (Phase 3).
 *
 * <p>Resout, pour un {@link BlastNotificationJob} de type {@link JobType#EMAIL_24H},
 * {@link JobType#EMAIL_6H} ou {@link JobType#EMAIL_30M} :
 * <ol>
 *   <li>La liste des destinataires du tir ({@link BlastRecipient}),</li>
 *   <li>Pour chaque destinataire, la langue preferee ({@code FR} / {@code EN}),</li>
 *   <li>Le template Thymeleaf correspondant ({@code blast/reminder_*_fr.html} ou
 *       {@code _en.html}),</li>
 *   <li>Le sujet bilingue defini dans le doc fonctionnel.</li>
 * </ol>
 *
 * <p>Chaque tentative est journalisee dans {@code blast_email_log}, avec
 * l'erreur SMTP verbatim si echec.
 *
 * <p>Degradation gracieuse : si la propriete {@code spring.mail.host} est vide
 * ou pointe vers {@code smtp.example.com} (defaut CI / dev sans SMTP reel),
 * l'envoi n'est PAS tente, un WARN est logge et le job est traite comme SENT
 * cote scheduler (les destinataires ne recevront rien, mais on n'ecrira pas
 * de boucle d'erreur dans la BDD non plus). Le {@link #isSmtpConfigured()}
 * controle ce mode.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BlastEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastEmailService.class);

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);
    private static final DateTimeFormatter DATE_EN = DateTimeFormatter.ofPattern("MM/dd/yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    static final String LANG_FR = "FR";
    static final String LANG_EN = "EN";

    private final BlastNotificationJobRepository jobRepository;
    private final BlastSettingRepository settingRepository;
    private final BlastEmailLogRepository emailLogRepository;
    private final SpringTemplateEngine templateEngine;
    private final MessageSender messageSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${blast.email.from:hse-noreply@safex360.com}")
    private String fromAddress;

    @Value("${blast.site.label:Mine — Site principal}")
    private String defaultSiteLabel;

    /**
     * Envoie tous les e-mails du job pour ses destinataires. Retourne
     * {@code true} si tout est parti (ou s'il n'y avait rien a envoyer en
     * mode degrade), {@code false} si au moins une erreur SMTP est survenue.
     */
    public boolean send(Long jobId) {
        BlastNotificationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "BlastNotificationJob not found: " + jobId));

        Blast blast = job.getBlast();
        if (blast == null) {
            LOGGER.warn("[BlastEmailService] job {} has no blast — skipped.", jobId);
            return true;
        }
        if (job.getType() != JobType.EMAIL_24H
                && job.getType() != JobType.EMAIL_6H
                && job.getType() != JobType.EMAIL_30M) {
            LOGGER.warn("[BlastEmailService] job {} is not an EMAIL job (type={}) — skipped.",
                    jobId, job.getType());
            return true;
        }

        // Pas de SMTP configure -> degradation gracieuse (dev / CI).
        if (!isSmtpConfigured()) {
            LOGGER.warn("[BlastEmailService] SMTP not configured (host='{}') — job {} marked as sent without actual delivery.",
                    mailHost, jobId);
            return true;
        }

        if (blast.getRecipients() == null || blast.getRecipients().isEmpty()) {
            LOGGER.info("[BlastEmailService] job {} blast {} has no recipient — nothing to send.",
                    jobId, blast.getReference());
            return true;
        }

        boolean allOk = true;
        BlastSetting setting = settingRepository.findByMineId(blast.getMineId()).orElse(null);

        for (BlastRecipient recipient : blast.getRecipients()) {
            String email = resolveEmail(recipient);
            if (email == null || email.isBlank()) {
                LOGGER.warn("[BlastEmailService] recipient {} has no email — skipped.", recipient.getId());
                continue;
            }
            String language = resolveLanguage(recipient);
            String templateName = resolveTemplateName(job.getType(), language);
            String subject = resolveSubject(job.getType(), language, blast);

            Context ctx = buildContext(blast, setting);
            String body;
            try {
                body = templateEngine.process(templateName, ctx);
            } catch (Exception ex) {
                LOGGER.error("[BlastEmailService] template '{}' failed for job {}: {}",
                        templateName, jobId, ex.getMessage());
                writeLog(jobId, email, subject, language, EmailLogStatus.FAILED, ex.getMessage());
                allOk = false;
                continue;
            }

            try {
                messageSender.send(email, subject, body);
                writeLog(jobId, email, subject, language, EmailLogStatus.SENT, null);
            } catch (Exception ex) {
                LOGGER.error("[BlastEmailService] SMTP failed for job {} -> {}: {}",
                        jobId, email, ex.getMessage());
                writeLog(jobId, email, subject, language, EmailLogStatus.FAILED, ex.getMessage());
                allOk = false;
            }
        }
        return allOk;
    }

    // ── Public for tests ──────────────────────────────────────────────────

    /**
     * SMTP est consideré comme configure si la propriete {@code spring.mail.host}
     * est non vide ET ne pointe pas vers un domaine d'exemple. Sert a couper
     * net les envois en dev / CI.
     */
    boolean isSmtpConfigured() {
        if (mailHost == null) return false;
        String h = mailHost.trim().toLowerCase(Locale.ROOT);
        if (h.isEmpty()) return false;
        if (h.contains("example.com") || h.contains("example.org")) return false;
        return true;
    }

    static String resolveLanguage(BlastRecipient recipient) {
        if (recipient == null || recipient.getPreferredLanguage() == null) {
            return LANG_FR;
        }
        String lang = recipient.getPreferredLanguage().trim().toUpperCase(Locale.ROOT);
        return LANG_EN.equals(lang) ? LANG_EN : LANG_FR;
    }

    static String resolveTemplateName(JobType type, String language) {
        String suffix = LANG_EN.equals(language) ? "en" : "fr";
        return switch (type) {
            case EMAIL_24H -> "blast/reminder_24h_" + suffix;
            case EMAIL_6H -> "blast/reminder_6h_" + suffix;
            case EMAIL_30M -> "blast/reminder_30m_" + suffix;
            default -> throw new IllegalArgumentException("Unsupported email type: " + type);
        };
    }

    static String resolveSubject(JobType type, String language, Blast blast) {
        String zone = formatZone(blast);
        String time = blast.getScheduledAt() != null
                ? blast.getScheduledAt().format(TIME_HH_MM) : "--:--";
        boolean fr = !LANG_EN.equals(language);
        return switch (type) {
            case EMAIL_24H -> fr
                    ? "Tir prevu demain — " + zone + ", " + formatDate(blast, true) + " a " + time
                    : "Blast scheduled tomorrow — " + zone + ", " + formatDate(blast, false) + " at " + time;
            case EMAIL_6H -> fr
                    ? "Rappel — tir aujourd'hui a " + time + " sur " + zone
                    : "Reminder — blast today at " + time + " at " + zone;
            case EMAIL_30M -> fr
                    ? "Tir dans 30 minutes — evacuez " + zone
                    : "Blast in 30 minutes — clear " + zone;
            default -> "";
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String resolveEmail(BlastRecipient recipient) {
        if (recipient == null) return null;
        if (recipient.getExternalEmail() != null && !recipient.getExternalEmail().isBlank()) {
            return recipient.getExternalEmail().trim();
        }
        // FK virtuelle employeeId -> module RH. Resolution applicative non
        // disponible dans ce module ; en l'absence d'adresse externe, on
        // skipperait. Cette branche est laissee pour evolution future.
        return null;
    }

    private Context buildContext(Blast blast, BlastSetting setting) {
        Context ctx = new Context();
        ctx.setVariable("blastReference", nullSafe(blast.getReference()));
        ctx.setVariable("zone", formatZone(blast));
        ctx.setVariable("date", formatDate(blast, true));
        ctx.setVariable("time", blast.getScheduledAt() != null
                ? blast.getScheduledAt().format(TIME_HH_MM) : "--:--");
        ctx.setVariable("exclusionRadius",
                blast.getExclusionRadiusM() != null
                        ? String.format(Locale.ROOT, "%.0f m", blast.getExclusionRadiusM())
                        : "—");
        ctx.setVariable("assemblyPoints", nullSafe(blast.getAssemblyPoints()));
        ctx.setVariable("blaster", blast.getBlasterId() != null
                ? "Boutefeu #" + blast.getBlasterId() : "—");
        ctx.setVariable("controlRoom", setting != null && setting.getControlRoomLabel() != null
                ? setting.getControlRoomLabel() : "Salle de controle");
        ctx.setVariable("site", defaultSiteLabel);
        return ctx;
    }

    private static String formatZone(Blast blast) {
        StringBuilder sb = new StringBuilder();
        if (blast.getPit() != null && !blast.getPit().isBlank()) {
            sb.append(blast.getPit());
        }
        if (blast.getBench() != null && !blast.getBench().isBlank()) {
            if (sb.length() > 0) sb.append(" — ");
            sb.append("Gradin ").append(blast.getBench());
        }
        if (sb.length() == 0) {
            return blast.getReference() != null ? blast.getReference() : "zone";
        }
        return sb.toString();
    }

    private static String formatDate(Blast blast, boolean fr) {
        if (blast.getScheduledAt() == null) return "--/--/----";
        return blast.getScheduledAt().format(fr ? DATE_FR : DATE_EN);
    }

    private static String nullSafe(String s) {
        return s != null ? s : "";
    }

    private void writeLog(Long jobId, String email, String subject, String language,
            EmailLogStatus status, String error) {
        BlastEmailLog log = BlastEmailLog.builder()
                .jobId(jobId)
                .recipient(email)
                .subject(subject)
                .language(language)
                .status(status)
                .error(error)
                .sentAt(LocalDateTime.now())
                .build();
        emailLogRepository.save(log);
    }

    /** Pour les tests / monitoring : expose l'adresse {@code from} configuree. */
    public String getFromAddress() {
        return fromAddress;
    }
}
