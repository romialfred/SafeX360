package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastSetting;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastSettingRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Implementation effective du planner de notifications de tir (Phase 3).
 *
 * <p>Calcule, a partir de l'instant prevu du tir ({@code blast.scheduledAt}) et
 * des reglages de la mine ({@link BlastSetting}), les instants exacts des
 * notifications a envoyer :
 * <ul>
 *   <li>{@link JobType#EMAIL_24H} a T - {@code reminder24hOffsetMinutes}</li>
 *   <li>{@link JobType#EMAIL_6H} a T - {@code reminder6hOffsetMinutes}</li>
 *   <li>{@link JobType#EMAIL_30M} a T - {@code reminder30mOffsetMinutes}</li>
 *   <li>{@link JobType#GENERAL_ALARM_10M} a T - {@code generalAlarmOffsetMinutes}</li>
 *   <li>Serie {@link JobType#POPUP_15M} de T-{@code popupWindowMinutes} jusqu'a
 *       T-0 toutes les {@code popupCadenceMinutes} minutes</li>
 * </ul>
 *
 * <p>Defauts (si aucun BlastSetting pour la mine) : 1440 / 360 / 30 / 10 minutes
 * + popups toutes les 15 min sur une fenetre de 120 min.
 *
 * <p>Idempotence : si l'on appelle {@link #planFor(Long)} sur un tir qui a deja
 * des jobs {@link JobStatus#SCHEDULED} en base, l'appel est silencieux et ne
 * re-insere pas. Pour replanifier, il faut explicitement passer par
 * {@link #cancelFor(Long)} puis {@link #planFor(Long)} — ou utiliser
 * {@link #rescheduleFor(Long, LocalDateTime)} qui enchaine les deux.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BlastNotificationPlannerImpl implements BlastNotificationPlanner {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastNotificationPlannerImpl.class);

    /** Defauts si la mine n'a pas encore de BlastSetting. */
    static final int DEFAULT_REMINDER_24H_MIN = 1440;
    static final int DEFAULT_REMINDER_6H_MIN = 360;
    static final int DEFAULT_REMINDER_30M_MIN = 30;
    static final int DEFAULT_POPUP_CADENCE_MIN = 15;
    static final int DEFAULT_POPUP_WINDOW_MIN = 120;
    static final int DEFAULT_GENERAL_ALARM_OFFSET_MIN = 10;

    private final BlastRepository blastRepository;
    private final BlastNotificationJobRepository jobRepository;
    private final BlastSettingRepository settingRepository;

    // ── Contrat existant ───────────────────────────────────────────────────

    @Override
    public void scheduleForBlast(Blast blast) {
        if (blast == null || blast.getId() == null) {
            LOGGER.warn("[BlastNotificationPlanner] scheduleForBlast called with null/transient blast — skipped.");
            return;
        }
        planForInternal(blast);
    }

    @Override
    public void planFor(Long blastId) {
        Blast blast = blastRepository.findById(blastId)
                .orElseThrow(() -> new EntityNotFoundException("Blast not found: " + blastId));
        planForInternal(blast);
    }

    @Override
    public void cancelFor(Long blastId) {
        List<BlastNotificationJob> scheduled = jobRepository
                .findByBlastIdAndStatus(blastId, JobStatus.SCHEDULED);
        for (BlastNotificationJob j : scheduled) {
            j.setStatus(JobStatus.CANCELLED);
            jobRepository.save(j);
        }
        LOGGER.info("[BlastNotificationPlanner] Cancelled {} scheduled job(s) for blast {}",
                scheduled.size(), blastId);
    }

    @Override
    public void rescheduleFor(Long blastId, LocalDateTime newDateTime) {
        if (newDateTime == null) {
            throw new IllegalArgumentException("newDateTime is required to reschedule notifications");
        }
        cancelFor(blastId);
        Blast blast = blastRepository.findById(blastId)
                .orElseThrow(() -> new EntityNotFoundException("Blast not found: " + blastId));
        blast.setScheduledAt(newDateTime);
        // On ne re-sauvegarde pas le blast ici : BlastService.reschedule l'a deja
        // fait. On se contente de regenerer la chaine sur la base de la nouvelle
        // valeur portee par l'entite chargee.
        planForInternal(blast);
    }

    // ── Logique de planification ──────────────────────────────────────────

    private void planForInternal(Blast blast) {
        // Idempotence : si des jobs SCHEDULED existent deja, on ne re-insere pas.
        long alreadyScheduled = jobRepository
                .countByBlastIdAndStatus(blast.getId(), JobStatus.SCHEDULED);
        if (alreadyScheduled > 0) {
            LOGGER.info("[BlastNotificationPlanner] blast id={} has {} SCHEDULED job(s) — skip (idempotent).",
                    blast.getId(), alreadyScheduled);
            return;
        }

        LocalDateTime t0 = blast.getScheduledAt();
        if (t0 == null) {
            LOGGER.warn("[BlastNotificationPlanner] blast id={} has no scheduledAt — cannot plan notifications.",
                    blast.getId());
            return;
        }

        BlastSetting setting = settingRepository.findByMineId(blast.getMineId()).orElse(null);
        int r24 = setting != null && setting.getReminder24hOffsetMinutes() > 0
                ? setting.getReminder24hOffsetMinutes() : DEFAULT_REMINDER_24H_MIN;
        int r6 = setting != null && setting.getReminder6hOffsetMinutes() > 0
                ? setting.getReminder6hOffsetMinutes() : DEFAULT_REMINDER_6H_MIN;
        int r30 = setting != null && setting.getReminder30mOffsetMinutes() > 0
                ? setting.getReminder30mOffsetMinutes() : DEFAULT_REMINDER_30M_MIN;
        int alarm = setting != null && setting.getGeneralAlarmOffsetMinutes() > 0
                ? setting.getGeneralAlarmOffsetMinutes() : DEFAULT_GENERAL_ALARM_OFFSET_MIN;
        int popupCadence = setting != null && setting.getPopupCadenceMinutes() > 0
                ? setting.getPopupCadenceMinutes() : DEFAULT_POPUP_CADENCE_MIN;
        int popupWindow = setting != null && setting.getPopupWindowMinutes() > 0
                ? setting.getPopupWindowMinutes() : DEFAULT_POPUP_WINDOW_MIN;

        List<BlastNotificationJob> toInsert = new ArrayList<>();
        toInsert.add(buildJob(blast, JobType.EMAIL_24H, t0.minusMinutes(r24)));
        toInsert.add(buildJob(blast, JobType.EMAIL_6H, t0.minusMinutes(r6)));
        toInsert.add(buildJob(blast, JobType.EMAIL_30M, t0.minusMinutes(r30)));
        toInsert.add(buildJob(blast, JobType.GENERAL_ALARM_10M, t0.minusMinutes(alarm)));

        // Serie de popups T-popupWindow -> T-0 toutes les popupCadence minutes.
        // On evite de dupliquer un popup qui tomberait pile sur T-alarm (rien
        // de critique, mais inutile : c'est l'alarme generale qui prend le
        // relais visuel a ce moment-la, le popup est une couche d'avertissement).
        for (int offset = popupWindow; offset >= 0; offset -= popupCadence) {
            LocalDateTime when = t0.minusMinutes(offset);
            toInsert.add(buildJob(blast, JobType.POPUP_15M, when));
        }

        jobRepository.saveAll(toInsert);
        LOGGER.info("[BlastNotificationPlanner] Planned {} job(s) for blast id={} ref={} scheduledAt={}",
                toInsert.size(), blast.getId(), blast.getReference(), t0);
    }

    private BlastNotificationJob buildJob(Blast blast, JobType type, LocalDateTime when) {
        return BlastNotificationJob.builder()
                .blast(blast)
                .type(type)
                .scheduledAt(when)
                .status(JobStatus.SCHEDULED)
                .attempts(0)
                .build();
    }
}
