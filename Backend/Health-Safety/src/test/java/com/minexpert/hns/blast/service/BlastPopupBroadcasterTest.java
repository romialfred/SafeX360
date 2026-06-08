package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;
import com.minexpert.hns.blast.enums.JobStatus;
import com.minexpert.hns.blast.enums.JobType;

/**
 * Tests unitaires de {@link BlastPopupBroadcaster} (Phase 4).
 *
 * <p>Verifie :
 * <ul>
 *   <li>Le payload STOMP contient toutes les cles documentees
 *       (blastId, reference, zone, scheduledAt, timeRemainingSeconds,
 *        minutesToBlast, language, mineId, pit, bench, etc.).</li>
 *   <li>Le push emet sur le topic canonique P4 {@code /topic/blast-popup},
 *       l'alias legacy {@code /topic/blast/popup} et le topic per-mine.</li>
 *   <li>Un job sans blast est silencieusement ignore.</li>
 *   <li>Le {@code minutesToBlast} est calcule a partir de
 *       {@code job.scheduledAt -> blast.scheduledAt}.</li>
 *   <li>Le {@code timeRemainingSeconds} est calcule par rapport a
 *       l'instant d'envoi (et peut etre negatif si le scheduler tire le
 *       job apres T-0).</li>
 *   <li>{@code language} est fixe a {@code BILINGUAL} (broadcast a tous).</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastPopupBroadcasterTest {

    @Mock
    private SimpMessagingTemplate messaging;

    @InjectMocks
    private BlastPopupBroadcaster broadcaster;

    private Blast buildBlast(LocalDateTime scheduledAt) {
        return Blast.builder()
                .id(42L)
                .reference("BLT-2026-0001")
                .scheduledAt(scheduledAt)
                .timezone("Africa/Ouagadougou")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.CONFIRMED)
                .pit("FOSSE_NORD")
                .bench("1080")
                .exclusionRadiusM(500.0)
                .assemblyPoints("R-Nord-1, R-Nord-2")
                .mineId(7L)
                .guards(new ArrayList<>())
                .recipients(new ArrayList<>())
                .notificationJobs(new ArrayList<>())
                .build();
    }

    private BlastNotificationJob buildJob(Blast blast, LocalDateTime jobAt) {
        return BlastNotificationJob.builder()
                .id(100L)
                .blast(blast)
                .type(JobType.POPUP_15M)
                .status(JobStatus.SCHEDULED)
                .scheduledAt(jobAt)
                .attempts(0)
                .build();
    }

    @Test
    @DisplayName("push: payload contient toutes les cles attendues (P4)")
    void pushPayloadShape() {
        LocalDateTime t0 = LocalDateTime.now().plusMinutes(15);
        Blast blast = buildBlast(t0);
        BlastNotificationJob job = buildJob(blast, t0.minusMinutes(15));

        broadcaster.push(job);

        ArgumentCaptor<Object> payloadCap = ArgumentCaptor.forClass(Object.class);
        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL), payloadCap.capture());
        Object captured = payloadCap.getValue();
        assertThat(captured).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) captured;
        assertThat(payload).containsKeys(
                "type", "blastId", "reference", "blastReference", "zone",
                "scheduledAt", "timeRemainingSeconds", "minutesToBlast",
                "language", "mineId", "pit", "bench", "exclusionRadiusM",
                "assemblyPoints", "jobId");
        assertThat(payload.get("type")).isEqualTo("BLAST_POPUP");
        assertThat(payload.get("blastId")).isEqualTo(42L);
        assertThat(payload.get("reference")).isEqualTo("BLT-2026-0001");
        assertThat(payload.get("blastReference")).isEqualTo("BLT-2026-0001");
        assertThat(payload.get("zone")).isEqualTo("FOSSE_NORD — Gradin 1080");
        assertThat(payload.get("language")).isEqualTo("BILINGUAL");
        assertThat(payload.get("mineId")).isEqualTo(7L);
        assertThat(payload.get("minutesToBlast")).isEqualTo(15L);
        assertThat(payload.get("jobId")).isEqualTo(100L);
    }

    @Test
    @DisplayName("push: timeRemainingSeconds reflete bien T0 - now (~900s pour T-15min)")
    void pushTimeRemainingSeconds() {
        LocalDateTime t0 = LocalDateTime.now().plusMinutes(15);
        Blast blast = buildBlast(t0);
        BlastNotificationJob job = buildJob(blast, t0.minusMinutes(15));

        broadcaster.push(job);

        ArgumentCaptor<Object> payloadCap = ArgumentCaptor.forClass(Object.class);
        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL), payloadCap.capture());
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) payloadCap.getValue();
        long remaining = ((Number) payload.get("timeRemainingSeconds")).longValue();
        // Tolerance de quelques secondes pour l'execution du test.
        assertThat(remaining).isBetween(880L, 905L);
    }

    @Test
    @DisplayName("push: emet sur TOPIC_GLOBAL, TOPIC_GLOBAL_LEGACY et TOPIC_MINE_PREFIX/{mineId}")
    void pushBroadcastsToAllChannels() {
        Blast blast = buildBlast(LocalDateTime.now().plusMinutes(15));
        BlastNotificationJob job = buildJob(blast, LocalDateTime.now());

        broadcaster.push(job);

        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL), org.mockito.ArgumentMatchers.<Object>any());
        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL_LEGACY), org.mockito.ArgumentMatchers.<Object>any());
        verify(messaging).convertAndSend(
                eq(BlastPopupBroadcaster.TOPIC_MINE_PREFIX + "7"),
                org.mockito.ArgumentMatchers.<Object>any());
    }

    @Test
    @DisplayName("push: blast sans mineId -> pas d'emission sur topic per-mine")
    void pushNoMineIdSkipsPerMineTopic() {
        Blast blast = buildBlast(LocalDateTime.now().plusMinutes(15));
        blast.setMineId(null);
        BlastNotificationJob job = buildJob(blast, LocalDateTime.now());

        broadcaster.push(job);

        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL), org.mockito.ArgumentMatchers.<Object>any());
        verify(messaging).convertAndSend(eq(BlastPopupBroadcaster.TOPIC_GLOBAL_LEGACY), org.mockito.ArgumentMatchers.<Object>any());
        verify(messaging, never()).convertAndSend(
                org.mockito.ArgumentMatchers.startsWith(BlastPopupBroadcaster.TOPIC_MINE_PREFIX),
                org.mockito.ArgumentMatchers.<Object>any());
    }

    @Test
    @DisplayName("push: job null -> silencieusement ignore (defensif)")
    void pushNullJobIsSafe() {
        broadcaster.push(null);
        verify(messaging, never()).convertAndSend(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.<Object>any());
    }

    @Test
    @DisplayName("push: job sans blast -> silencieusement ignore (defensif)")
    void pushNullBlastIsSafe() {
        BlastNotificationJob job = BlastNotificationJob.builder()
                .id(100L).type(JobType.POPUP_15M).build();
        broadcaster.push(job);
        verify(messaging, never()).convertAndSend(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.<Object>any());
    }

    @Test
    @DisplayName("buildPayload: zone se replie sur reference si pit/bench vides")
    void buildPayloadZoneFallback() {
        Blast blast = buildBlast(LocalDateTime.now().plusMinutes(15));
        blast.setPit(null);
        blast.setBench(null);
        BlastNotificationJob job = buildJob(blast, LocalDateTime.now());

        Map<String, Object> payload = broadcaster.buildPayload(blast, job);

        assertThat(payload.get("zone")).isEqualTo("BLT-2026-0001");
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
