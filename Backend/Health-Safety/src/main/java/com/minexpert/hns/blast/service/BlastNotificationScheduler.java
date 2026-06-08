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
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;

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

    /**
     * Message bilingue diffuse lors du declenchement de l'Alerte Generale a
     * T-10 minutes (Phase 4). Reutilise l'infrastructure
     * {@link GeneralAlertService} (sirene + voix TTS + popup balayante)
     * sans la re-implementer ; seul le texte du message change.
     *
     * <p>Format : « FR … // EN … » sur deux lignes. La voix TTS du
     * GeneralAlertListener parle dans la langue UI courante de chaque
     * utilisateur (FR ou EN), donc concatener les deux versions dans le
     * meme champ {@code message} reste lisible cote operateur (le standard
     * du LOT 48 prefixe deja un message bilingue de drill/real).
     */
    static final String GENERAL_ALARM_MESSAGE_FR =
            "Ceci n'est pas un exercice. Attention, dynamitage imminent. "
                    + "Veuillez evacuer immediatement et rejoindre le point "
                    + "de rassemblement le plus proche.";
    static final String GENERAL_ALARM_MESSAGE_EN =
            "This is not a drill. Warning: blasting imminent. "
                    + "Evacuate immediately and proceed to the nearest assembly point.";

    private final BlastNotificationJobRepository jobRepository;
    private final BlastRepository blastRepository;
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
                    // 1) Bascule auto a IMMINENT (avant declenchement alerte)
                    //    si le tir est encore CONFIRMED. Idempotent : si on
                    //    est deja IMMINENT (re-execution / retry), on ne
                    //    refait pas la transition.
                    promoteToImminent(blast);

                    // 2) Re-utilisation stricte de l'infrastructure existante
                    //    GeneralAlertService.trigger (sirene + voix TTS +
                    //    popup balayante, cf. LOT 48 Phase 4). Seul le
                    //    message change : bilingue FR+EN, format strict de
                    //    la specification P4. Le service est idempotent :
                    //    si une alerte ACTIVE existe deja pour la mine,
                    //    elle est retournee sans nouvelle creation, ce qui
                    //    nous met a l'abri d'un double declenchement.
                    GeneralAlertRequest req = new GeneralAlertRequest();
                    req.setCompanyId(blast.getMineId());
                    req.setReasonCode("BLAST_T10");
                    req.setMessage(buildBilingualAlarmMessage(blast));
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

    /**
     * Bascule le statut d'un blast {@code CONFIRMED} vers {@code IMMINENT} en
     * meme transaction que le declenchement de l'alerte T-10. Idempotent :
     * <ul>
     *   <li>Si le blast est deja {@code IMMINENT} / {@code FIRED} /
     *       {@code MISFIRE} / {@code ALL_CLEAR}, aucune action.</li>
     *   <li>Si le blast est dans un statut incompatible
     *       ({@code CANCELLED}, {@code POSTPONED}, {@code DRAFT},
     *       {@code PLANNED}), on logge un warning et on s'abstient — le
     *       scheduler ne doit pas corriger un workflow casse cote operateur.</li>
     * </ul>
     *
     * <p>Le blast est rerelu via le repository pour eviter d'agir sur une
     * version detachee (le {@code job.getBlast()} peut etre une copie issue
     * d'un fetch eager dans une transaction passee).
     *
     * <p>Volontairement package-private pour les tests unitaires (verifient
     * l'idempotence et le rejet des statuts incompatibles).
     */
    void promoteToImminent(Blast snapshot) {
        Long blastId = snapshot.getId();
        if (blastId == null) {
            LOGGER.warn("[BlastNotificationScheduler] promoteToImminent: transient blast — skipped.");
            return;
        }
        Blast managed = blastRepository.findById(blastId).orElse(null);
        if (managed == null) {
            LOGGER.warn("[BlastNotificationScheduler] promoteToImminent: blast id={} disappeared — skipped.",
                    blastId);
            return;
        }
        BlastStatus current = managed.getStatus();
        if (current == BlastStatus.IMMINENT
                || current == BlastStatus.FIRED
                || current == BlastStatus.MISFIRE
                || current == BlastStatus.ALL_CLEAR) {
            // Deja avance dans le workflow — on respecte la decision metier.
            return;
        }
        if (current != BlastStatus.CONFIRMED) {
            // CANCELLED / POSTPONED / DRAFT / PLANNED : l'alerte T-10 ne
            // devrait normalement pas etre dispatchee dans ces cas-la (le
            // job aurait du etre CANCELLED). Mais si elle l'est, on logge
            // et on laisse passer : le scheduler n'est pas en position de
            // corriger un workflow casse.
            LOGGER.warn("[BlastNotificationScheduler] promoteToImminent: blast id={} in unexpected status {} — alarm dispatched anyway, status not changed.",
                    blastId, current);
            return;
        }
        managed.setStatus(BlastStatus.IMMINENT);
        managed.setUpdatedAt(LocalDateTime.now());
        blastRepository.save(managed);
        LOGGER.info("[BlastNotificationScheduler] blast id={} ref={} promoted to IMMINENT (T-10 alarm).",
                blastId, managed.getReference());
    }

    /**
     * Construit le message bilingue de l'Alerte Generale T-10. Le frontend
     * affiche la version adaptee a la langue UI active, mais on transporte
     * les deux pour qu'un audit ulterieur soit auto-portant.
     *
     * <p>Format strict de la specification :</p>
     * <ul>
     *   <li>FR : « Ceci n'est pas un exercice. Attention, dynamitage imminent.
     *       Veuillez evacuer immediatement et rejoindre le point de
     *       rassemblement le plus proche. »</li>
     *   <li>EN : « This is not a drill. Warning: blasting imminent. Evacuate
     *       immediately and proceed to the nearest assembly point. »</li>
     * </ul>
     *
     * <p>La reference et la zone du tir sont ajoutees a la fin entre
     * parentheses pour la tracabilite (« — Reference: BLT-… — Zone: … »).
     */
    static String buildBilingualAlarmMessage(Blast blast) {
        String ref = blast.getReference() != null ? blast.getReference() : "—";
        StringBuilder zone = new StringBuilder();
        if (blast.getPit() != null && !blast.getPit().isBlank()) {
            zone.append(blast.getPit());
        }
        if (blast.getBench() != null && !blast.getBench().isBlank()) {
            if (zone.length() > 0) zone.append(" — ");
            zone.append("Gradin ").append(blast.getBench());
        }
        if (zone.length() == 0) zone.append(ref);
        return GENERAL_ALARM_MESSAGE_FR
                + " / " + GENERAL_ALARM_MESSAGE_EN
                + " — Reference: " + ref
                + " — Zone: " + zone;
    }
}
