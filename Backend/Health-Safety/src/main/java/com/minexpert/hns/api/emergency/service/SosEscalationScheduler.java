package com.minexpert.hns.api.emergency.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.api.emergency.entity.EmergencySettings;
import com.minexpert.hns.api.emergency.entity.EscalationRule;
import com.minexpert.hns.api.emergency.entity.SosAlert;
import com.minexpert.hns.api.emergency.enums.EmergencyAuditEventType;
import com.minexpert.hns.api.emergency.enums.SosStatus;
import com.minexpert.hns.api.emergency.repository.EmergencySettingsRepository;
import com.minexpert.hns.api.emergency.repository.EscalationRuleRepository;
import com.minexpert.hns.api.emergency.repository.SosAlertRepository;

import lombok.RequiredArgsConstructor;

/**
 * Scheduler d'escalade automatique des SOS (LOT 48 Phase 6).
 *
 * <p>Toutes les 15 secondes, scanne les SOS encore en {@code RECEIVED} dont
 * l'âge dépasse {@code autoDispatchSeconds} (défaut 120s défini dans
 * {@code EmergencySettings}). Pour chaque SOS éligible :</p>
 *
 * <ol>
 *   <li>Détermine l'étape d'escalade courante (combien de fois déjà escaladé)</li>
 *   <li>Cherche la {@link EscalationRule} correspondante pour la mine</li>
 *   <li>Envoie un message WebSocket spécifique sur
 *       {@code /topic/emergency/escalation/{permission|userId}} pour notifier
 *       les cibles</li>
 *   <li>Trace dans le journal d'audit immuable (SOS_ESCALATED)</li>
 * </ol>
 *
 * <p>L'étape courante est encodée dans le {@code description} JSON-ish du SOS
 * pour rester compatible avec le schema existant sans migration BDD.
 * Format : {@code [ESC:N] message original}</p>
 */
@Service
@RequiredArgsConstructor
public class SosEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SosEscalationScheduler.class);

    private final SosAlertRepository sosRepo;
    private final EmergencySettingsRepository settingsRepo;
    private final EscalationRuleRepository escalationRepo;
    private final EmergencyAuditService auditService;
    private final SimpMessagingTemplate messaging;
    private final EmergencyEmailService emergencyEmailService;

    /**
     * Fréquence du scan : toutes les 15 secondes. Suffit pour des SOS à
     * granularité 60s+. Si le réglage métier impose une granularité fine,
     * réduire ici.
     */
    @Scheduled(fixedDelay = 15_000, initialDelay = 30_000)
    @Transactional
    public void escalateStaleSos() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.minusSeconds(60);
        List<SosAlert> active = sosRepo.findEscalationCandidates(SosStatus.RECEIVED, threshold);

        if (active.isEmpty()) return;

        for (SosAlert sos : active) {
            try {
                processOne(sos, now);
            } catch (Exception e) {
                log.error("Escalation failed for SOS#{}: {}", sos.getId(), e.getMessage(), e);
            }
        }
    }

    private void processOne(SosAlert sos, LocalDateTime now) {
        if (sos.getTriggeredAt() == null) {
            log.warn("SOS#{} has null triggeredAt — skipping escalation", sos.getId());
            return;
        }

        // Settings de la mine (defaults si absent)
        EmergencySettings settings = settingsRepo.findByCompanyId(sos.getCompanyId())
            .orElse(null);
        int autoDispatchSeconds = (settings != null && settings.getAutoDispatchSeconds() != null)
            ? settings.getAutoDispatchSeconds()
            : 120;

        long ageSeconds = Duration.between(sos.getTriggeredAt(), now).getSeconds();
        if (ageSeconds < autoDispatchSeconds) return;

        // Étape d'escalade courante (extraction depuis description)
        int currentStep = readEscalationStep(sos);

        // Récupère les règles d'escalade ordonnées pour cette mine
        List<EscalationRule> rules = escalationRepo
            .findByCompanyIdAndStatusOrderByStepOrderAsc(sos.getCompanyId(), "ACTIVE");

        if (rules.isEmpty()) return;

        // L'étape suivante est currentStep + 1 (1-based)
        int nextStepOrder = currentStep + 1;
        EscalationRule rule = rules.stream()
            .filter(r -> r.getStepOrder() != null && r.getStepOrder() == nextStepOrder)
            .findFirst()
            .orElse(null);

        if (rule == null) {
            // Plus d'étape disponible : on a tout escaladé, on s'arrête
            return;
        }

        // Vérifie que le délai cumulé écoulé dépasse celui de l'étape
        // (auto-dispatch + délais cumulés des étapes précédentes)
        long requiredAge = autoDispatchSeconds;
        for (EscalationRule r : rules) {
            if (r.getStepOrder() != null && r.getStepOrder() <= currentStep && r.getDelaySeconds() != null) {
                requiredAge += r.getDelaySeconds();
            }
        }
        requiredAge += rule.getDelaySeconds() != null ? rule.getDelaySeconds() : 0;
        if (ageSeconds < requiredAge) return;

        // ── Escalation effective ──
        writeEscalationStep(sos, nextStepOrder);
        sosRepo.save(sos);

        // Audit log
        auditService.log(
            EmergencyAuditEventType.SOS_ESCALATED,
            null, sos.getCompanyId(),
            "SosAlert", sos.getId(),
            "{\"step\":" + nextStepOrder + ",\"rule\":\"" + jsonSafe(rule.getName())
                + "\",\"target\":\"" + (rule.getTargetPermission() != null
                    ? rule.getTargetPermission().name()
                    : ("USER#" + rule.getTargetUserId())) + "\"}",
            null, null
        );

        // Broadcast WebSocket — isolé pour ne pas perdre le save DB en cas d'erreur STOMP
        try {
            String topic = rule.getTargetPermission() != null
                ? "/topic/emergency/escalation/" + rule.getTargetPermission().name()
                : "/topic/emergency/escalation/user/" + rule.getTargetUserId();
            messaging.convertAndSend(topic, java.util.Map.of(
                "sosAlertId", sos.getId(),
                "step", nextStepOrder,
                "ruleName", rule.getName(),
                "companyId", sos.getCompanyId(),
                "triggeredAt", sos.getTriggeredAt().toString()
            ));

            messaging.convertAndSend(
                "/topic/emergency/sos/company/" + sos.getCompanyId(),
                java.util.Map.of(
                    "escalated", true,
                    "sosAlertId", sos.getId(),
                    "step", nextStepOrder
                )
            );

            java.util.HashMap<String, Object> escalationPayload = new java.util.HashMap<>();
            escalationPayload.put("type", "ESCALATION");
            escalationPayload.put("sosAlertId", sos.getId());
            escalationPayload.put("reasonCode", sos.getReasonCode() != null ? sos.getReasonCode() : "");
            escalationPayload.put("stepOrder", nextStepOrder);
            escalationPayload.put("targetPermission", rule.getTargetPermission() != null ? rule.getTargetPermission().name() : "");
            escalationPayload.put("companyId", sos.getCompanyId());
            escalationPayload.put("message", rule.getName());
            messaging.convertAndSend(
                "/topic/emergency/escalation/company/" + sos.getCompanyId(),
                escalationPayload
            );
        } catch (Exception e) {
            log.error("[SosEscalationScheduler] WebSocket broadcast failed for SOS#{} step {}: {}", sos.getId(), nextStepOrder, e.getMessage(), e);
        }

        try {
            emergencyEmailService.notifySosEscalated(
                    sos.getId(), null, sos.getReasonCode(), nextStepOrder);
        } catch (Exception e) {
            log.warn("Email notification failed for SOS#{} escalation step {}: {}", sos.getId(), nextStepOrder, e.getMessage());
        }

        log.info("SOS#{} escalated to step {} ({})", sos.getId(), nextStepOrder, rule.getName());
    }

    // ── Helpers extraction étape d'escalade ────────────────────────────────

    /** Lit l'étape d'escalade actuelle depuis la description. 0 si non encore escaladé. */
    private int readEscalationStep(SosAlert sos) {
        String desc = sos.getDescription();
        if (desc == null) return 0;
        if (desc.startsWith("[ESC:")) {
            int end = desc.indexOf(']');
            if (end > 5) {
                try {
                    return Integer.parseInt(desc.substring(5, end));
                } catch (NumberFormatException ignored) { /* fall through */ }
            }
        }
        return 0;
    }

    /** Met à jour l'étape d'escalade dans la description. */
    private void writeEscalationStep(SosAlert sos, int step) {
        String desc = sos.getDescription();
        if (desc == null) desc = "";
        // Strip ancien marqueur
        if (desc.startsWith("[ESC:")) {
            int end = desc.indexOf(']');
            if (end > 0 && end < desc.length()) {
                desc = desc.substring(end + 1).trim();
            }
        }
        sos.setDescription("[ESC:" + step + "] " + desc);
    }

    private String jsonSafe(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
