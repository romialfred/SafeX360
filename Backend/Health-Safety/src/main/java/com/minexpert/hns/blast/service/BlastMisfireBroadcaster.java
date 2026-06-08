package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.minexpert.hns.blast.entity.Blast;

import lombok.RequiredArgsConstructor;

/**
 * Diffuseur WebSocket STOMP des notifications de raté (misfire) — P5.
 *
 * <p>Lorsqu'un boutefeu declare un raté via {@code BlastService.declareMisfire},
 * une popup interne est emise pour alerter immediatement :
 * <ul>
 *   <li>Le boutefeu en charge (champ {@code blasterId}) — confirmation visuelle
 *       que sa declaration est bien enregistree.</li>
 *   <li>Le HSE_LEAD du tir (champ {@code hseLeadId}) — declenchement immediat
 *       du protocole d'inspection / deminage.</li>
 *   <li>Tout poste de la salle de controle abonne au topic global — visibilite
 *       multi-mines pour les superviseurs centralises.</li>
 * </ul>
 *
 * <h2>Topics emis</h2>
 * <ul>
 *   <li>{@value #TOPIC_GLOBAL} — broadcast canonique aux clients qui ecoutent
 *       toutes les mines (admins / coordinateurs centralises).</li>
 *   <li>{@value #TOPIC_MINE_PREFIX}{@code {mineId}} — popup limitee aux clients
 *       d'une mine specifique (canal principal sur lequel le frontend filtre).</li>
 * </ul>
 *
 * <h2>Payload</h2>
 * <pre>
 * {
 *   "type":             "BLAST_MISFIRE",
 *   "blastId":          42,
 *   "reference":        "BLT-2026-0001",
 *   "zone":             "FOSSE_NORD — Gradin 1080",
 *   "scheduledAt":      "2026-06-18T14:00:00",
 *   "mineId":           7,
 *   "pit":              "FOSSE_NORD",
 *   "bench":            "1080",
 *   "exclusionRadiusM": 500.0,
 *   "blasterId":        11,
 *   "hseLeadId":        22,
 *   "reason":           "Detonateur 12 silencieux",
 *   "declaredAt":       "2026-06-18T14:03:42",
 *   "language":         "BILINGUAL"
 * }
 * </pre>
 *
 * <p>Le payload est volontairement plat (Map) pour ne pas dependre d'un DTO
 * cote frontend. Le champ {@code language} est positionne a {@code BILINGUAL} —
 * la popup est diffusee a tous les abonnes, charge au frontend d'afficher le
 * texte dans la langue UI active de chaque operateur.
 *
 * <p>Aucune persistance n'est faite par ce diffuseur : la trace d'audit du
 * raté est deja assuree par {@code BlastAuditService.logTransition} avec la
 * raison ({@code BlastStatusEvent}, append-only). Si la diffusion STOMP echoue
 * (broker indisponible, abonne deconnecte), l'erreur est loggee mais ne
 * propage pas — la declaration de raté ne doit JAMAIS etre bloquee par un
 * canal cosmetique.
 */
@Service
@RequiredArgsConstructor
public class BlastMisfireBroadcaster {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastMisfireBroadcaster.class);

    /** Topic canonique P5 — broadcast a tous les utilisateurs connectes. */
    public static final String TOPIC_GLOBAL = "/topic/blast-misfire";

    /** Topic prefixe pour le filtrage par mine. Concatener {@code mineId}. */
    public static final String TOPIC_MINE_PREFIX = "/topic/blast-misfire/mine/";

    private final SimpMessagingTemplate messaging;

    /**
     * Diffuse la popup de raté pour un tir. Defensif : silencieusement ignore
     * si {@code blast == null}.
     *
     * @param blast  le tir concerne (qui vient de passer en {@code MISFIRE})
     * @param reason raison libre saisie par le boutefeu (descriptif du raté)
     */
    public void broadcast(Blast blast, String reason) {
        if (blast == null) {
            LOGGER.warn("[BlastMisfireBroadcaster] broadcast called with null blast — skipped.");
            return;
        }
        Map<String, Object> payload = buildPayload(blast, reason);
        try {
            messaging.convertAndSend(TOPIC_GLOBAL, payload);
            if (blast.getMineId() != null) {
                messaging.convertAndSend(TOPIC_MINE_PREFIX + blast.getMineId(), payload);
            }
            LOGGER.info("[BlastMisfireBroadcaster] misfire popup pushed for blast id={} ref={} mineId={}",
                    blast.getId(), blast.getReference(), blast.getMineId());
        } catch (Exception ex) {
            // Defense en profondeur : la declaration de raté est l'action
            // critique, la popup est cosmetique. On logge et on continue.
            LOGGER.error("[BlastMisfireBroadcaster] STOMP broadcast failed for blast {}: {}",
                    blast.getReference(), ex.getMessage(), ex);
        }
    }

    /**
     * Construit le payload de la popup de raté. Visible package-private pour
     * les tests unitaires (assertions structurees sans devoir capturer
     * l'argument du SimpMessagingTemplate).
     */
    Map<String, Object> buildPayload(Blast blast, String reason) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "BLAST_MISFIRE");
        payload.put("blastId", blast.getId());
        payload.put("reference", blast.getReference());
        payload.put("zone", formatZone(blast));
        payload.put("scheduledAt", blast.getScheduledAt() != null
                ? blast.getScheduledAt().toString() : null);
        payload.put("mineId", blast.getMineId());
        payload.put("pit", blast.getPit());
        payload.put("bench", blast.getBench());
        payload.put("exclusionRadiusM", blast.getExclusionRadiusM());
        payload.put("blasterId", blast.getBlasterId());
        payload.put("hseLeadId", blast.getHseLeadId());
        payload.put("reason", reason);
        payload.put("declaredAt", LocalDateTime.now().toString());
        payload.put("language", "BILINGUAL");
        return payload;
    }

    /**
     * Concatene fosse + gradin pour former une zone humaine ; tombe sur la
     * reference si aucun des deux n'est renseigne. Identique a
     * {@code BlastPopupBroadcaster.formatZone} pour coherence UI.
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
