package com.minexpert.hns.blast.service;

import java.time.Duration;
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
 * Diffuseur WebSocket STOMP des popups de tir (Phase 3 / Phase 4).
 *
 * <p>Topics emis :</p>
 * <ul>
 *   <li>{@value #TOPIC_GLOBAL} — broadcast canonique aux clients qui ecoutent
 *       toutes les mines (admins / coordinateurs centralises). Conforme a la
 *       specification P4 (« topic {@code /topic/blast-popup} »).</li>
 *   <li>{@value #TOPIC_GLOBAL_LEGACY} — alias historique conserve pour la
 *       retrocompatibilite des clients deployes avant P4. <strong>Ne pas
 *       supprimer sans plan de migration</strong>.</li>
 *   <li>{@value #TOPIC_MINE_PREFIX}{@code {mineId}} — popup limite aux clients
 *       d'une mine (canal principal sur lequel le frontend filtre par defaut).</li>
 * </ul>
 *
 * <h2>Payload</h2>
 * <pre>
 * {
 *   "type":               "BLAST_POPUP",
 *   "blastId":            42,
 *   "reference":          "BLT-2026-0001",
 *   "zone":               "FOSSE_NORD — Gradin 1080",
 *   "scheduledAt":        "2026-06-18T14:00:00",   // ISO LocalDateTime
 *   "timeRemainingSeconds": 900,                    // T0 - now (peut etre <0)
 *   "minutesToBlast":     15,                       // T0 - jobScheduledAt
 *   "language":           "BILINGUAL",              // FR / EN / BILINGUAL
 *   "mineId":             7,
 *   "pit":                "FOSSE_NORD",
 *   "bench":              "1080",
 *   "exclusionRadiusM":   500.0,
 *   "assemblyPoints":     "R-Nord-1, R-Nord-2",
 *   "jobId":              100
 * }
 * </pre>
 *
 * <p>Le payload est volontairement plat (Map) pour ne pas dependre d'un DTO
 * cote frontend. Le champ {@code language} est positionne a {@code BILINGUAL}
 * par defaut : la popup est diffusee en broadcast a tous les utilisateurs
 * connectes, charge au frontend d'afficher le texte dans la langue UI active.
 *
 * @see BlastNotificationScheduler#processOne(BlastNotificationJob)
 */
@Service
@RequiredArgsConstructor
public class BlastPopupBroadcaster {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastPopupBroadcaster.class);

    /** Topic canonique P4 — broadcast a tous les utilisateurs connectes. */
    public static final String TOPIC_GLOBAL = "/topic/blast-popup";

    /** Alias historique — conserve pour la retrocompatibilite des clients deja deployes. */
    public static final String TOPIC_GLOBAL_LEGACY = "/topic/blast/popup";

    /** Topic prefixe pour le filtrage par mine. Concatener {@code mineId}. */
    public static final String TOPIC_MINE_PREFIX = "/topic/blast-popup/mine/";

    private final SimpMessagingTemplate messaging;

    /**
     * Pousse une popup pour un job de type {@code POPUP_15M}.
     *
     * <p>L'envoi est silencieusement ignore si le job ou son blast est
     * {@code null} (defensif : ce cas ne devrait pas arriver via le
     * scheduler en exploitation, mais peut survenir lors d'un nettoyage de
     * donnees partiel).
     *
     * @param job le job a diffuser. Doit etre rattache a un {@link Blast}.
     */
    public void push(BlastNotificationJob job) {
        if (job == null || job.getBlast() == null) {
            LOGGER.warn("[BlastPopupBroadcaster] push called with null job or blast — skipped.");
            return;
        }
        Blast blast = job.getBlast();
        Map<String, Object> payload = buildPayload(blast, job);

        messaging.convertAndSend(TOPIC_GLOBAL, payload);
        messaging.convertAndSend(TOPIC_GLOBAL_LEGACY, payload);
        if (blast.getMineId() != null) {
            messaging.convertAndSend(TOPIC_MINE_PREFIX + blast.getMineId(), payload);
        }
        LOGGER.info("[BlastPopupBroadcaster] popup pushed for blast id={} ref={} (T-{}min, remaining={}s)",
                blast.getId(), blast.getReference(),
                payload.get("minutesToBlast"), payload.get("timeRemainingSeconds"));
    }

    /**
     * Construit le payload de la popup. Visible package-private pour les tests
     * unitaires (assertions structurees sans devoir capturer l'argument du
     * SimpMessagingTemplate).
     */
    Map<String, Object> buildPayload(Blast blast, BlastNotificationJob job) {
        LocalDateTime t0 = blast.getScheduledAt();
        LocalDateTime now = LocalDateTime.now();
        Long minutesToBlast = null;
        if (t0 != null && job != null && job.getScheduledAt() != null) {
            minutesToBlast = Duration.between(job.getScheduledAt(), t0).toMinutes();
        }
        Long timeRemainingSeconds = null;
        if (t0 != null) {
            timeRemainingSeconds = Duration.between(now, t0).getSeconds();
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "BLAST_POPUP");
        payload.put("blastId", blast.getId());
        payload.put("reference", blast.getReference());
        payload.put("blastReference", blast.getReference()); // alias legacy
        payload.put("zone", formatZone(blast));
        payload.put("scheduledAt", t0 != null ? t0.toString() : null);
        payload.put("timeRemainingSeconds", timeRemainingSeconds);
        payload.put("minutesToBlast", minutesToBlast);
        payload.put("language", "BILINGUAL");
        payload.put("mineId", blast.getMineId());
        payload.put("pit", blast.getPit());
        payload.put("bench", blast.getBench());
        payload.put("exclusionRadiusM", blast.getExclusionRadiusM());
        payload.put("assemblyPoints", blast.getAssemblyPoints());
        payload.put("jobId", job != null ? job.getId() : null);
        return payload;
    }

    /**
     * Concatene fosse + gradin pour former une zone humaine ; tombe sur la
     * reference si aucun des deux n'est renseigne.
     */
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
}
