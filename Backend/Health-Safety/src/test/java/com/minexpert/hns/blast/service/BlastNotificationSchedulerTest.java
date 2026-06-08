package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.api.emergency.dto.GeneralAlertDTO;
import com.minexpert.hns.api.emergency.dto.GeneralAlertRequest;
import com.minexpert.hns.api.emergency.service.GeneralAlertService;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;

/**
 * Tests unitaires de {@link BlastNotificationScheduler} (Phase 3).
 *
 * <p>Couvre :
 * <ul>
 *   <li>poll() dispatche un EMAIL_24H vers {@link BlastEmailService#send}
 *       puis marque SENT.</li>
 *   <li>poll() dispatche un POPUP_15M vers {@link BlastPopupBroadcaster#push}.</li>
 *   <li>poll() dispatche un GENERAL_ALARM_10M vers
 *       {@link GeneralAlertService#trigger}.</li>
 *   <li>Echec -> retry avec backoff progressif et FAILED definitif apres 3
 *       tentatives.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastNotificationSchedulerTest {

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private BlastEmailService emailService;

    @Mock
    private BlastPopupBroadcaster popupBroadcaster;

    @Mock
    private GeneralAlertService generalAlertService;

    @InjectMocks
    private BlastNotificationScheduler scheduler;

    private Blast buildBlast() {
        return Blast.builder()
                .id(42L)
                .reference("BLT-2026-0001")
                .scheduledAt(LocalDateTime.of(2026, 6, 18, 14, 0))
                .timezone("UTC")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.CONFIRMED)
                .mineId(7L)
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();
    }

    private BlastNotificationJob buildJob(JobType type) {
        return BlastNotificationJob.builder()
                .id(100L)
                .blast(buildBlast())
                .type(type)
                .status(JobStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .build();
    }

    @Test
    @DisplayName("poll: EMAIL_24H -> emailService.send + marque SENT")
    void pollDispatchesEmail() {
        BlastNotificationJob job = buildJob(JobType.EMAIL_24H);
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of(job));
        when(emailService.send(100L)).thenReturn(true);

        scheduler.poll();

        verify(emailService).send(100L);
        assertThat(job.getStatus()).isEqualTo(JobStatus.SENT);
        assertThat(job.getSentAt()).isNotNull();
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("poll: POPUP_15M -> popupBroadcaster.push + marque SENT")
    void pollDispatchesPopup() {
        BlastNotificationJob job = buildJob(JobType.POPUP_15M);
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of(job));

        scheduler.poll();

        verify(popupBroadcaster).push(job);
        assertThat(job.getStatus()).isEqualTo(JobStatus.SENT);
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("poll: GENERAL_ALARM_10M -> generalAlertService.trigger + marque SENT")
    void pollDispatchesGeneralAlarm() {
        BlastNotificationJob job = buildJob(JobType.GENERAL_ALARM_10M);
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of(job));
        when(generalAlertService.trigger(any(GeneralAlertRequest.class), anyLong()))
                .thenReturn(new GeneralAlertDTO());

        scheduler.poll();

        verify(generalAlertService).trigger(any(GeneralAlertRequest.class), eq(0L));
        assertThat(job.getStatus()).isEqualTo(JobStatus.SENT);
    }

    @Test
    @DisplayName("poll: emailService.send retourne false -> retry SCHEDULED avec backoff (60s)")
    void pollEmailFailureSchedulesRetry() {
        BlastNotificationJob job = buildJob(JobType.EMAIL_6H);
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of(job));
        when(emailService.send(100L)).thenReturn(false);

        LocalDateTime before = LocalDateTime.now();
        scheduler.poll();

        // Reste SCHEDULED, attempts=1, scheduledAt repousse de ~60s.
        assertThat(job.getStatus()).isEqualTo(JobStatus.SCHEDULED);
        assertThat(job.getAttempts()).isEqualTo(1);
        assertThat(job.getLastError()).isNotNull();
        assertThat(job.getScheduledAt()).isAfter(before.plusSeconds(55));
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("poll: 3 echecs successifs -> FAILED definitif")
    void pollThreeFailuresThenFailedDefinitive() {
        BlastNotificationJob job = buildJob(JobType.EMAIL_6H);
        // Pre-positionne 2 tentatives deja effectuees.
        job.setAttempts(2);
        when(emailService.send(100L)).thenReturn(false);

        scheduler.processOne(job);

        assertThat(job.getStatus()).isEqualTo(JobStatus.FAILED);
        assertThat(job.getAttempts()).isEqualTo(3);
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("poll: aucun job due -> aucun appel aux services")
    void pollNoJobsDoesNothing() {
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of());

        scheduler.poll();

        verify(emailService, never()).send(anyLong());
        verify(popupBroadcaster, never()).push(any());
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("poll: une exception sur un job ne bloque pas les autres jobs")
    void pollExceptionDoesNotStopBatch() {
        BlastNotificationJob ok = buildJob(JobType.POPUP_15M);
        ok.setId(101L);
        BlastNotificationJob ko = buildJob(JobType.EMAIL_24H);
        ko.setId(102L);
        when(jobRepository.findDueJobs(eq(JobStatus.SCHEDULED), any(LocalDateTime.class)))
                .thenReturn(List.of(ko, ok));
        when(emailService.send(102L)).thenThrow(new RuntimeException("BOOM"));

        scheduler.poll();

        // Le popup est passe malgre l'echec de l'email.
        verify(popupBroadcaster).push(ok);
        assertThat(ok.getStatus()).isEqualTo(JobStatus.SENT);
        // Le job en echec est repousse (1 tentative).
        assertThat(ko.getAttempts()).isEqualTo(1);
        // Et un save pour ok (SENT) + un save pour ko (retry).
        verify(jobRepository, times(2)).save(any(BlastNotificationJob.class));
    }
}
