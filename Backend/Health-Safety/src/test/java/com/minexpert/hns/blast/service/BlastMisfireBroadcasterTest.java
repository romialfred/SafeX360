package com.minexpert.hns.blast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.enums.BlastStatus;
import com.minexpert.hns.blast.enums.BlastType;

/**
 * Tests unitaires de {@link BlastMisfireBroadcaster} (P5).
 *
 * <p>Couvre :
 * <ul>
 *   <li>Diffusion sur le topic global {@code /topic/blast-misfire}.</li>
 *   <li>Diffusion sur le topic mine {@code /topic/blast-misfire/mine/{mineId}}.</li>
 *   <li>Payload : type, blastId, reference, zone, mineId, blasterId, hseLeadId,
 *       reason, declaredAt.</li>
 *   <li>Defensif : blast null = no-op silencieux ; exception broker = log + no rethrow.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BlastMisfireBroadcasterTest {

    @Mock
    private SimpMessagingTemplate messaging;

    @InjectMocks
    private BlastMisfireBroadcaster broadcaster;

    private Blast buildBlast() {
        return Blast.builder()
                .id(42L)
                .reference("BLT-2026-0001")
                .scheduledAt(LocalDateTime.of(2026, 6, 18, 14, 0))
                .timezone("Africa/Ouagadougou")
                .type(BlastType.PRODUCTION)
                .status(BlastStatus.MISFIRE)
                .pit("FOSSE_NORD")
                .bench("1080")
                .exclusionRadiusM(500.0)
                .blasterId(11L)
                .hseLeadId(22L)
                .mineId(7L)
                .build();
    }

    @Test
    @DisplayName("broadcast: emet sur le topic global ET le topic mine")
    void broadcastEmitsOnBothTopics() {
        Blast b = buildBlast();

        broadcaster.broadcast(b, "Detonateur 12 silencieux");

        verify(messaging).convertAndSend(eq(BlastMisfireBroadcaster.TOPIC_GLOBAL), any(Object.class));
        verify(messaging).convertAndSend(
                eq(BlastMisfireBroadcaster.TOPIC_MINE_PREFIX + "7"),
                any(Object.class));
    }

    @Test
    @DisplayName("buildPayload: contient les champs cles BLAST_MISFIRE + raison")
    void buildPayloadStructure() {
        Blast b = buildBlast();

        Map<String, Object> payload = broadcaster.buildPayload(b, "Trou 7 silencieux");

        assertThat(payload).containsEntry("type", "BLAST_MISFIRE");
        assertThat(payload).containsEntry("blastId", 42L);
        assertThat(payload).containsEntry("reference", "BLT-2026-0001");
        assertThat(payload).containsEntry("mineId", 7L);
        assertThat(payload).containsEntry("pit", "FOSSE_NORD");
        assertThat(payload).containsEntry("bench", "1080");
        assertThat(payload).containsEntry("exclusionRadiusM", 500.0);
        assertThat(payload).containsEntry("blasterId", 11L);
        assertThat(payload).containsEntry("hseLeadId", 22L);
        assertThat(payload).containsEntry("reason", "Trou 7 silencieux");
        assertThat(payload).containsEntry("language", "BILINGUAL");
        // Zone formatee humaine
        assertThat(payload.get("zone")).isEqualTo("FOSSE_NORD — Gradin 1080");
        // declaredAt present (string ISO)
        assertThat(payload.get("declaredAt")).isInstanceOf(String.class);
    }

    @Test
    @DisplayName("broadcast: blast null -> no-op silencieux (defense)")
    void broadcastNullBlastIsSilent() {
        broadcaster.broadcast(null, "test");

        verify(messaging, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    @DisplayName("broadcast: si SimpMessagingTemplate throw, no rethrow (popup cosmetique)")
    void broadcastSwallowsException() {
        Blast b = buildBlast();
        org.mockito.Mockito.doThrow(new RuntimeException("broker down"))
                .when(messaging).convertAndSend(eq(BlastMisfireBroadcaster.TOPIC_GLOBAL), any(Object.class));

        // No exception thrown.
        broadcaster.broadcast(b, "test");
    }

    @Test
    @DisplayName("buildPayload: mineId null -> pas de topic mine emis")
    void noMineTopicWhenMineIdNull() {
        Blast b = buildBlast();
        b.setMineId(null);

        broadcaster.broadcast(b, "test");

        verify(messaging).convertAndSend(eq(BlastMisfireBroadcaster.TOPIC_GLOBAL), any(Object.class));
        verify(messaging, never()).convertAndSend(
                org.mockito.ArgumentMatchers.startsWith(BlastMisfireBroadcaster.TOPIC_MINE_PREFIX),
                any(Object.class));
    }
}
