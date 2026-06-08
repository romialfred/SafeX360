package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.entity.BlastSetting;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastSettingRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Tests unitaires de {@link BlastNotificationPlannerImpl} (Phase 3).
 *
 * <p>Couvre :
 * <ul>
 *   <li>planFor : creation des 4 jobs cles (24h / 6h / 30min / alarme T-10)
 *       + la serie de popups T-2h -> T-0 toutes les 15min</li>
 *   <li>cancelFor : bascule de tous les SCHEDULED en CANCELLED</li>
 *   <li>rescheduleFor : cancel + plan sur la nouvelle heure</li>
 *   <li>idempotence : un 2eme appel a planFor ne double pas la chaine</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastNotificationPlannerTest {

    @Mock
    private BlastRepository blastRepository;

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private BlastSettingRepository settingRepository;

    @InjectMocks
    private BlastNotificationPlannerImpl planner;

    private Blast blast;

    @BeforeEach
    void setUp() {
        blast = Blast.builder()
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

    @Test
    @DisplayName("planFor: cree les 4 jobs cles + la serie de popups (defaults 1440/360/30/10/15/120)")
    void planForCreatesAllJobs() {
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());
        when(jobRepository.countByBlastIdAndStatus(42L, JobStatus.SCHEDULED)).thenReturn(0L);

        planner.planFor(42L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<BlastNotificationJob>> captor = ArgumentCaptor.forClass(List.class);
        verify(jobRepository).saveAll(captor.capture());
        List<BlastNotificationJob> inserted = captor.getValue();

        // 4 jobs cles + (120/15 + 1) = 9 popups = 13 au total avec les defauts
        assertThat(inserted).hasSize(4 + (120 / 15 + 1));

        // Verifie qu'on a bien les 4 types principaux exactement une fois.
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.EMAIL_24H).count())
                .isEqualTo(1L);
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.EMAIL_6H).count())
                .isEqualTo(1L);
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.EMAIL_30M).count())
                .isEqualTo(1L);
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.GENERAL_ALARM_10M).count())
                .isEqualTo(1L);
        // Popups : 9 entries (offsets 120, 105, 90, 75, 60, 45, 30, 15, 0).
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.POPUP_15M).count())
                .isEqualTo(9L);

        // Tous les jobs sont SCHEDULED, attempts = 0, blast attache.
        assertThat(inserted).allMatch(j -> j.getStatus() == JobStatus.SCHEDULED);
        assertThat(inserted).allMatch(j -> j.getAttempts() == 0);
        assertThat(inserted).allMatch(j -> j.getBlast() == blast);

        // Verifie les offsets exacts des 4 jobs cles vs scheduledAt = 2026-06-18 14:00.
        LocalDateTime t0 = blast.getScheduledAt();
        assertThat(findOne(inserted, JobType.EMAIL_24H).getScheduledAt())
                .isEqualTo(t0.minusMinutes(1440));
        assertThat(findOne(inserted, JobType.EMAIL_6H).getScheduledAt())
                .isEqualTo(t0.minusMinutes(360));
        assertThat(findOne(inserted, JobType.EMAIL_30M).getScheduledAt())
                .isEqualTo(t0.minusMinutes(30));
        assertThat(findOne(inserted, JobType.GENERAL_ALARM_10M).getScheduledAt())
                .isEqualTo(t0.minusMinutes(10));
    }

    @Test
    @DisplayName("planFor: respecte les overrides de BlastSetting si fournis")
    void planForRespectsSettings() {
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));
        when(jobRepository.countByBlastIdAndStatus(42L, JobStatus.SCHEDULED)).thenReturn(0L);
        BlastSetting setting = BlastSetting.builder()
                .id(1L)
                .mineId(7L)
                .reminder24hOffsetMinutes(1440)
                .reminder6hOffsetMinutes(360)
                .reminder30mOffsetMinutes(45)
                .popupCadenceMinutes(30)
                .popupWindowMinutes(60)
                .generalAlarmOffsetMinutes(10)
                .defaultTimezone("UTC")
                .build();
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.of(setting));

        planner.planFor(42L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<BlastNotificationJob>> captor = ArgumentCaptor.forClass(List.class);
        verify(jobRepository).saveAll(captor.capture());
        List<BlastNotificationJob> inserted = captor.getValue();

        // 60/30 + 1 = 3 popups (offsets 60, 30, 0).
        assertThat(inserted.stream().filter(j -> j.getType() == JobType.POPUP_15M).count())
                .isEqualTo(3L);
        // L'offset 30 min du dernier rappel mail est respecte.
        assertThat(findOne(inserted, JobType.EMAIL_30M).getScheduledAt())
                .isEqualTo(blast.getScheduledAt().minusMinutes(45));
    }

    @Test
    @DisplayName("planFor: appel idempotent — 2eme invocation ne re-insere rien")
    void planForIsIdempotent() {
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));
        // 1er appel : 0 SCHEDULED -> insert
        // 2eme appel : > 0 SCHEDULED -> skip (idempotent)
        when(jobRepository.countByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(0L)
                .thenReturn(13L);
        lenient().when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());

        planner.planFor(42L);
        planner.planFor(42L);

        // saveAll a ete appele exactement 1 fois (le 2eme appel est court-circuite).
        verify(jobRepository).saveAll(any());
    }

    @Test
    @DisplayName("planFor: leve une EntityNotFoundException si le blast n'existe pas")
    void planForBlastNotFound() {
        when(blastRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> planner.planFor(999L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("cancelFor: bascule tous les SCHEDULED -> CANCELLED")
    void cancelForCancelsAllScheduledJobs() {
        BlastNotificationJob j1 = BlastNotificationJob.builder()
                .id(1L).blast(blast).type(JobType.EMAIL_24H)
                .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now())
                .attempts(0).build();
        BlastNotificationJob j2 = BlastNotificationJob.builder()
                .id(2L).blast(blast).type(JobType.GENERAL_ALARM_10M)
                .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now())
                .attempts(0).build();
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of(j1, j2));

        planner.cancelFor(42L);

        assertThat(j1.getStatus()).isEqualTo(JobStatus.CANCELLED);
        assertThat(j2.getStatus()).isEqualTo(JobStatus.CANCELLED);
        verify(jobRepository).save(j1);
        verify(jobRepository).save(j2);
    }

    @Test
    @DisplayName("cancelFor: ne touche pas aux jobs deja SENT / FAILED / CANCELLED")
    void cancelForLeavesNonScheduledAlone() {
        // findByBlastIdAndStatus(.., SCHEDULED) ne renvoie pas les autres statuts.
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of());

        planner.cancelFor(42L);

        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("rescheduleFor: equivalent a cancelFor + planFor sur la nouvelle heure")
    void rescheduleForCancelsAndReplans() {
        BlastNotificationJob j1 = BlastNotificationJob.builder()
                .id(1L).blast(blast).type(JobType.EMAIL_24H)
                .status(JobStatus.SCHEDULED).scheduledAt(LocalDateTime.now())
                .attempts(0).build();
        when(jobRepository.findByBlastIdAndStatus(42L, JobStatus.SCHEDULED))
                .thenReturn(List.of(j1));
        when(blastRepository.findById(42L)).thenReturn(Optional.of(blast));
        when(jobRepository.countByBlastIdAndStatus(42L, JobStatus.SCHEDULED)).thenReturn(0L);
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());

        LocalDateTime newTime = LocalDateTime.of(2026, 6, 20, 9, 0);
        planner.rescheduleFor(42L, newTime);

        // L'ancien job est bascule CANCELLED.
        assertThat(j1.getStatus()).isEqualTo(JobStatus.CANCELLED);

        // De nouveaux jobs sont inseres en lot (saveAll).
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<BlastNotificationJob>> captor = ArgumentCaptor.forClass(List.class);
        verify(jobRepository).saveAll(captor.capture());
        List<BlastNotificationJob> inserted = captor.getValue();
        assertThat(inserted).isNotEmpty();
        // La nouvelle heure est portee par l'entite blast (mise a jour dans rescheduleFor).
        assertThat(blast.getScheduledAt()).isEqualTo(newTime);
        // Les offsets sont calcules sur la nouvelle heure.
        assertThat(findOne(inserted, JobType.EMAIL_24H).getScheduledAt())
                .isEqualTo(newTime.minusMinutes(1440));
    }

    @Test
    @DisplayName("rescheduleFor: refuse une newDateTime null")
    void rescheduleForRejectsNullDate() {
        assertThatThrownBy(() -> planner.rescheduleFor(42L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("newDateTime");
    }

    @Test
    @DisplayName("scheduleForBlast: alias compatible P1, ignore un blast transient sans id")
    void scheduleForBlastAliasIgnoresTransient() {
        Blast transient1 = Blast.builder()
                .reference("BLT-TRANSIENT")
                .scheduledAt(LocalDateTime.now().plusHours(1))
                .timezone("UTC")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.CONFIRMED)
                .mineId(7L)
                .build();

        planner.scheduleForBlast(transient1);

        // Aucun acces repo : id null = noop securitaire.
        verify(jobRepository, never()).saveAll(any());
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("scheduleForBlast: appel non idempotent avec id present declenche le planFor")
    void scheduleForBlastDelegatesToPlan() {
        when(jobRepository.countByBlastIdAndStatus(42L, JobStatus.SCHEDULED)).thenReturn(0L);
        when(settingRepository.findByMineId(7L)).thenReturn(Optional.empty());

        planner.scheduleForBlast(blast);

        verify(jobRepository).saveAll(any());
        // PAS d'appel a findById ici : on est passe par l'API "objet" directe,
        // qui evite le round-trip BDD (le blast est deja en main).
        verify(blastRepository, never()).findById(eq(42L));
    }

    private BlastNotificationJob findOne(List<BlastNotificationJob> jobs, JobType type) {
        return jobs.stream().filter(j -> j.getType() == type).findFirst().orElseThrow();
    }
}
