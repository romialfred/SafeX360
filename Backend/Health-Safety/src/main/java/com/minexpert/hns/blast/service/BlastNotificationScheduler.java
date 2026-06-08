package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.dto.GeneralAlertRequest;
import com.minexpert.hns.api.emergency.service.GeneralAlertService;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;

import lombok.RequiredArgsConstructor;

/**
 * Scheduler des notifications de tir (Phase 3).
 *
 * <p>Tous les 30 secondes, pioche les jobs {@link JobStatus#SCHEDULED} dont
 * {@code scheduledAt &lt;= NOW} et les execute selon leur type :
 * <ul>
 *   <li>{@code EMAIL_24H} / {@code EMAIL_6H} / {@code EMAIL_30M} : delegue a
 *       {@link BlastEmailService#send(Long)} (envoi SMTP via MailMessageSender,
 *       templates Thymeleaf bilingues).</li>
 *   <li>{@code POPUP_15M} : delegue a {@link BlastPopupBroadcaster#push} qui
 *       diffuse sur les topics STOMP {@code /topic/blast/popup}.</li>
 *   <li>{@code GENERAL_ALARM_10M} : reutilise
 *       {@link GeneralAlertService#trigger(GeneralAlertRequest, Long)} qui pousse
 *       l'Alerte Generale + audit.</li>
 * </ul>
 *
 * <p>Retry : un job en {@code FAILED} est rebascule en {@code SCHEDULED} avec
 * un {@code scheduledAt} repousse (60s, 5min, 30min). Apres la 3eme tentative
 * echouee, le job reste {@code FAILED} definitivement (last_error rempli, plus
 * aucune nouvelle tentative).
 *
 * <p>Frequence : 30 secondes. Suffit pour des rappels 24h/6h/30min (decalage
 * acceptable). Le job {@code GENERAL_ALARM_10M} est exact a la minute pres :
 * l'imprecision de ~30s est compatible avec la pratique terrain (l'operateur
 * reste en boucle de surveillance physique pendant cette derniere fenetre).
 */
@Service
@RequiredArgsConstructor
public class BlastNotificationScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastNotificationScheduler.class);

    /** Tentatives maximum avant abandon definitif d'un job. */
    static final int MAX_ATTEMPTS = 3;

    /** Backoff seconds par tentative (1ere retry = +60s, 2eme = +5min, 3eme = +30min). */
    static final long[] BACKOFF_SECONDS = {60L, 300L, 1800L};

    private final BlastNotificationJobRepository jobRepository;
    private final BlastEmailService emailService;
    private final BlastPopupBroadcaster popupBroadcaster;
    private final GeneralAlertService generalAlertService;

    /**
     * Poll des jobs SCHEDULED dont l'echeance est passee. Le fixedDelay garantit
     * qu'on ne deroule pas deux scans simultanes (la prochaine execution attend
     * 30s apres la fin de la precedente).
     */
    @Scheduled(fixedDelay = 30_000L, initialDelay = 30_000L)
    public void poll() {
        LocalDateTime now = LocalDateTime.now();
        List<BlastNotificationJob> due = jobRepository.findDueJobs(JobStatus.SCHEDULED, now);
        if (due.isEmpty()) {
            return;
        }
        LOGGER.info("[BlastNotificationScheduler] {} job(s) due at {}", due.size(), now);
        for (BlastNotificationJob job : due) {
            try {
                processOne(job);
            } catch (Exception ex) {
                LOGGER.error("[BlastNotificationScheduler] job {} crashed: {}",
                        job.getId(), ex.getMessage(), ex);
                handleFailure(job, ex.getMessage());
            }
        }
    }

    /**
     * Dispatch d'un job selon son type. Methode visible package-private pour
     * tests unitaires (appel direct sans devoir attendre le tick @Scheduled).
     */
    @Transactional
    public void processOne(BlastNotificationJob job) {
        boolean success;
        switch (job.getType()) {
            case EMAIL_24H, EMAIL_6H, EMAIL_30M -> success = emailService.send(job.getId());
            case POPUP_15M -> {
                popupBroadcaster.push(job);
                success = true;
            }
            case GENERAL_ALARM_10M -> {
                Blast blast = job.getBlast();
                if (blast == null) {
                    LOGGER.warn("[BlastNotificationScheduler] GENERAL_ALARM_10M job {} has no blast — skipped.",
                            job.getId());
                    success = true;
                } else {
                    GeneralAlertRequest req = new GeneralAlertRequest();
                    req.setCompanyId(blast.getMineId());
                    req.setReasonCode("BLAST_T10");
                    req.setMessage("Tir " + blast.getReference()
                            + " — declenchement de l'alerte generale a T-10 minutes.");
                    req.setDrillMode(Boolean.FALSE);
                    generalAlertService.trigger(req, 0L);
                    success = true;
                }
            }
            default -> {
                LOGGER.warn("[BlastNotificationScheduler] unknown job type {} — skipped.",
                        job.getType());
                success = true;
            }
        }
        if (success) {
            markSent(job);
        } else {
            handleFailure(job, "delivery channel reported failure");
        }
    }

    private void markSent(BlastNotificationJob job) {
        job.setStatus(JobStatus.SENT);
        job.setSentAt(LocalDateTime.now());
        job.setLastError(null);
        jobRepository.save(job);
    }

    private void handleFailure(BlastNotificationJob job, String error) {
        int attempts = job.getAttempts() + 1;
        job.setAttempts(attempts);
        job.setLastError(error);
        if (attempts >= MAX_ATTEMPTS) {
            job.setStatus(JobStatus.FAILED);
            jobRepository.save(job);
            LOGGER.error("[BlastNotificationScheduler] job {} FAILED definitively after {} attempts: {}",
                    job.getId(), attempts, error);
            return;
        }
        // Retry : on garde SCHEDULED en repoussant scheduledAt selon backoff.
        long backoff = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
        job.setStatus(JobStatus.SCHEDULED);
        job.setScheduledAt(LocalDateTime.now().plusSeconds(backoff));
        jobRepository.save(job);
        LOGGER.warn("[BlastNotificationScheduler] job {} attempt {}/{} failed; retry in {}s. Error: {}",
                job.getId(), attempts, MAX_ATTEMPTS, backoff, error);
    }
}
