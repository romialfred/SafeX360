package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.minexpert.hns.blast.entity.Blast;
import com.minexpert.hns.blast.entity.BlastNotificationJob;

import lombok.RequiredArgsConstructor;

/**
 * Diffuseur WebSocket STOMP des popups de tir (Phase 3).
 *
 * <p>Pousse sur les topics :
 * <ul>
 *   <li>{@code /topic/blast/popup} — broadcast global (legacy / debug)</li>
 *   <li>{@code /topic/blast/popup/mine/{mineId}} — popup limite aux clients d'une mine</li>
 * </ul>
 *
 * <p>Le payload est volontairement plat (Map) pour rester debarrasse de toute
 * dependance DTO. Le frontend choisit l'affichage selon le {@code minutesToBlast}
 * (popup info, popup attention a T-30 / T-15, plein ecran a T-0).
 */
@Service
@RequiredArgsConstructor
public class BlastPopupBroadcaster {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastPopupBroadcaster.class);

    static final String TOPIC_GLOBAL = "/topic/blast/popup";
    static final String TOPIC_MINE_PREFIX = "/topic/blast/popup/mine/";

    private final SimpMessagingTemplate messaging;

    /** Pousse une popup pour un job de type POPUP_15M. */
    public void push(BlastNotificationJob job) {
        if (job == null || job.getBlast() == null) {
            LOGGER.warn("[BlastPopupBroadcaster] push called with null job or blast — skipped.");
            return;
        }
        Blast blast = job.getBlast();
        LocalDateTime t0 = blast.getScheduledAt();
        Long minutesToBlast = null;
        if (t0 != null && job.getScheduledAt() != null) {
            minutesToBlast = java.time.Duration.between(job.getScheduledAt(), t0).toMinutes();
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "BLAST_POPUP");
        payload.put("jobId", job.getId());
        payload.put("blastId", blast.getId());
        payload.put("blastReference", blast.getReference());
        payload.put("mineId", blast.getMineId());
        payload.put("scheduledAt", t0 != null ? t0.toString() : null);
        payload.put("pit", blast.getPit());
        payload.put("bench", blast.getBench());
        payload.put("zone", blast.getPit() != null ? blast.getPit() : blast.getReference());
        payload.put("exclusionRadiusM", blast.getExclusionRadiusM());
        payload.put("assemblyPoints", blast.getAssemblyPoints());
        payload.put("minutesToBlast", minutesToBlast);

        messaging.convertAndSend(TOPIC_GLOBAL, payload);
        if (blast.getMineId() != null) {
            messaging.convertAndSend(TOPIC_MINE_PREFIX + blast.getMineId(), payload);
        }
        LOGGER.info("[BlastPopupBroadcaster] popup pushed for blast id={} ref={} (T-{}min)",
                blast.getId(), blast.getReference(), minutesToBlast);
    }
}
