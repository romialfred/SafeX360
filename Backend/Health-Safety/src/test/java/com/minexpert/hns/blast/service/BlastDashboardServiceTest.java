package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.minexpert.hns.blast.dto.BlastDashboardDTO;
import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastPlan;
import com.minexpert.hns.blast.entity.BlastStatusEvent;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.repository.BlastNotificationJobRepository;
import com.minexpert.hns.blast.repository.BlastPlanRepository;
import com.minexpert.hns.blast.repository.BlastRepository;
import com.minexpert.hns.blast.repository.BlastStatusEventRepository;

/**
 * Tests unitaires de {@link BlastDashboardServiceImpl} (Phase 7).
 *
 * <p>Couvre :
 * <ul>
 *   <li>Construction de l'agregat sans donnees (retourne des compteurs a 0
 *       et des listes vides, jamais null).</li>
 *   <li>Identification du "prochain tir" : prend le 1er CONFIRMED le plus
 *       proche, calcule {@code secondsUntil}.</li>
 *   <li>Repartition par statut : chaque enum est present meme a 0.</li>
 *   <li>KPI totalExplosivesKg : somme les plans FIRED+ALL_CLEAR du mois.</li>
 *   <li>KPI onTimeRate : compte +/-15 min de tolerance.</li>
 *   <li>Validation : mineId nul leve IllegalArgumentException.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastDashboardServiceTest {

    @Mock
    private BlastRepository blastRepository;

    @Mock
    private BlastPlanRepository blastPlanRepository;

    @Mock
    private BlastNotificationJobRepository jobRepository;

    @Mock
    private BlastStatusEventRepository statusEventRepository;

    @InjectMocks
    private BlastDashboardServiceImpl service;

    private static final long MINE = 1L;

    @BeforeEach
    void defaults() {
        // Defauts neutres pour les tests "vide". Lenient car certains tests
        // surchargent ces stubs.
        lenient().when(blastRepository.findActiveBlastsToday(eq(MINE), any(), any()))
                .thenReturn(List.of());
        lenient().when(blastRepository.findScheduledBetween(eq(MINE), any(), any(), anyList()))
                .thenReturn(List.of());
        lenient().when(blastRepository.findByMineIdAndStatusIn(eq(MINE), anyList()))
                .thenReturn(List.of());
        lenient().when(jobRepository.countByMineAndStatusAndWindow(
                eq(MINE), any(JobStatus.class), any(), any()))
                .thenReturn(0L);
        lenient().when(statusEventRepository.findByToStatusAndAtBetween(
                eq(BlastStatus.FIRED), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    @DisplayName("getSummary throws when mineId is null")
    void rejectNullMineId() {
        assertThatThrownBy(() -> service.getSummary(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mineId");
    }

    @Test
    @DisplayName("getSummary on empty repos returns zeroed aggregate, no null")
    void emptyRepositoriesReturnSafeZeroes() {
        BlastDashboardDTO dto = service.getSummary(MINE);

        assertThat(dto).isNotNull();
        assertThat(dto.getUpcomingToday()).isEmpty();
        assertThat(dto.getUpcomingThisWeek()).isEmpty();
        assertThat(dto.getUpcomingThisWeekCount()).isZero();
        assertThat(dto.getNextConfirmedBlast()).isNull();
        assertThat(dto.getLastFinishedBlasts()).isEmpty();
        assertThat(dto.getStatusBreakdown()).isNotNull();
        // Chaque statut doit etre present, valeur = 0
        for (BlastStatus s : BlastStatus.values()) {
            assertThat(dto.getStatusBreakdown().get(s)).isEqualTo(0);
        }
        assertThat(dto.getNotificationsState()).isNotNull();
        assertThat(dto.getNotificationsState().getSent()).isZero();
        assertThat(dto.getNotificationsState().getScheduled()).isZero();
        assertThat(dto.getNotificationsState().getFailed()).isZero();
        assertThat(dto.getKpis()).isNotNull();
        assertThat(dto.getKpis().getBlastsThisMonth()).isZero();
        assertThat(dto.getKpis().getTotalExplosivesKg()).isZero();
        assertThat(dto.getKpis().getAvgPowderFactor()).isZero();
        assertThat(dto.getKpis().getOnTimeRate()).isZero();
        assertThat(dto.getKpis().getMisfireCount()).isZero();
        assertThat(dto.getKpis().getBlastsToday()).isZero();
    }

    @Test
    @DisplayName("nextConfirmedBlast picks the earliest CONFIRMED/IMMINENT blast and computes secondsUntil")
    void nextConfirmedPicksFirst() {
        LocalDateTime now = LocalDateTime.now();
        Blast a = buildBlast(10L, "BLT-A", BlastStatus.CONFIRMED, now.plusHours(2), "FOSSE_NORD");
        Blast b = buildBlast(20L, "BLT-B", BlastStatus.CONFIRMED, now.plusHours(5), "FOSSE_SUD");
        when(blastRepository.findScheduledBetween(eq(MINE), any(), any(), anyList()))
                .thenAnswer(inv -> {
                    Collection<BlastStatus> statuses = inv.getArgument(3);
                    if (statuses.contains(BlastStatus.PLANNED)
                            && statuses.contains(BlastStatus.CONFIRMED)) {
                        return List.of(a, b);
                    }
                    return List.of();
                });

        BlastDashboardDTO dto = service.getSummary(MINE);

        assertThat(dto.getNextConfirmedBlast()).isNotNull();
        assertThat(dto.getNextConfirmedBlast().getId()).isEqualTo(10L);
        assertThat(dto.getNextConfirmedBlast().getReference()).isEqualTo("BLT-A");
        assertThat(dto.getNextConfirmedBlast().getSecondsUntil()).isGreaterThan(60L * 60L);
        assertThat(dto.getNextConfirmedBlast().getZone()).isEqualTo("FOSSE_NORD");
        assertThat(dto.getUpcomingThisWeekCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("totalExplosivesKg sums plan.explosiveQtyKg on realised blasts of the month")
    void totalExplosivesSumsPlans() {
        LocalDateTime now = LocalDateTime.now();
        Blast a = buildBlast(101L, "BLT-101", BlastStatus.FIRED, now.minusDays(2), null);
        Blast b = buildBlast(102L, "BLT-102", BlastStatus.ALL_CLEAR, now.minusDays(1), null);
        when(blastRepository.findScheduledBetween(eq(MINE), any(), any(), anyList()))
                .thenAnswer(inv -> {
                    Collection<BlastStatus> statuses = inv.getArgument(3);
                    if (statuses.contains(BlastStatus.FIRED)
                            && statuses.contains(BlastStatus.ALL_CLEAR)
                            && statuses.size() == 2) {
                        return List.of(a, b);
                    }
                    if (statuses.size() == BlastStatus.values().length) {
                        return List.of(a, b);
                    }
                    return List.of();
                });
        when(blastPlanRepository.findByBlastId(101L)).thenReturn(Optional.of(plan(120.5d, 0.8d)));
        when(blastPlanRepository.findByBlastId(102L)).thenReturn(Optional.of(plan(80d, 0.6d)));

        BlastDashboardDTO dto = service.getSummary(MINE);

        assertThat(dto.getKpis().getTotalExplosivesKg()).isEqualTo(200.5d);
        assertThat(dto.getKpis().getAvgPowderFactor()).isEqualTo(0.7d);
    }

    @Test
    @DisplayName("onTimeRate computes percentage within +/-15 min tolerance")
    void onTimeRateComputesPercentage() {
        LocalDateTime sched = LocalDateTime.now().minusDays(3).withMinute(0).withSecond(0).withNano(0);
        Blast b1 = buildBlast(201L, "BLT-201", BlastStatus.FIRED, sched, null);
        Blast b2 = buildBlast(202L, "BLT-202", BlastStatus.FIRED, sched, null);
        Blast b3 = buildBlast(203L, "BLT-203", BlastStatus.FIRED, sched, null);

        BlastStatusEvent e1 = BlastStatusEvent.builder()
                .blastId(201L).at(sched.plusMinutes(5))
                .toStatus(BlastStatus.FIRED).build();
        BlastStatusEvent e2 = BlastStatusEvent.builder()
                .blastId(202L).at(sched.minusMinutes(10))
                .toStatus(BlastStatus.FIRED).build();
        BlastStatusEvent e3 = BlastStatusEvent.builder()
                .blastId(203L).at(sched.plusMinutes(45))
                .toStatus(BlastStatus.FIRED).build();
        when(statusEventRepository.findByToStatusAndAtBetween(
                eq(BlastStatus.FIRED), any(), any()))
                .thenReturn(List.of(e1, e2, e3));
        when(blastRepository.findById(201L)).thenReturn(Optional.of(b1));
        when(blastRepository.findById(202L)).thenReturn(Optional.of(b2));
        when(blastRepository.findById(203L)).thenReturn(Optional.of(b3));

        BlastDashboardDTO dto = service.getSummary(MINE);

        // 2 sur 3 ont ete realises dans les 15 min => 66.67 %
        assertThat(dto.getKpis().getOnTimeRate()).isEqualTo(66.67d);
    }

    @Test
    @DisplayName("notifications state aggregates SENT, SCHEDULED and FAILED counts of the month")
    void notificationsStateCounts() {
        when(jobRepository.countByMineAndStatusAndWindow(
                eq(MINE), eq(JobStatus.SENT), any(), any())).thenReturn(48L);
        when(jobRepository.countByMineAndStatusAndWindow(
                eq(MINE), eq(JobStatus.SCHEDULED), any(), any())).thenReturn(12L);
        when(jobRepository.countByMineAndStatusAndWindow(
                eq(MINE), eq(JobStatus.FAILED), any(), any())).thenReturn(3L);

        BlastDashboardDTO dto = service.getSummary(MINE);

        assertThat(dto.getNotificationsState().getSent()).isEqualTo(48);
        assertThat(dto.getNotificationsState().getScheduled()).isEqualTo(12);
        assertThat(dto.getNotificationsState().getFailed()).isEqualTo(3);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private Blast buildBlast(Long id, String ref, BlastStatus status,
            LocalDateTime scheduled, String alarmZone) {
        return Blast.builder()
                .id(id)
                .reference(ref)
                .scheduledAt(scheduled)
                .timezone("UTC")
                .type(BlastType.PRODUCTION)
                .status(status)
                .mineId(MINE)
                .pit("PIT-N")
                .alarmZoneScope(alarmZone)
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();
    }

    private BlastPlan plan(double explosiveKg, double powderFactor) {
        return BlastPlan.builder()
                .explosiveQtyKg(explosiveKg)
                .powderFactor(powderFactor)
                .build();
    }
}
