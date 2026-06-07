package com.minexpert.hns.dosimetry.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dosimetry.entity.ExposureAlert;
import com.minexpert.hns.dosimetry.entity.OverexposureCase;
import com.minexpert.hns.dosimetry.enums.AlertStatus;
import com.minexpert.hns.dosimetry.enums.CaseStatus;
import com.minexpert.hns.dosimetry.repository.ExposureAlertRepository;
import com.minexpert.hns.dosimetry.repository.OverexposureCaseRepository;

import lombok.RequiredArgsConstructor;

/**
 * Scheduler d'escalade des notifications dosimetriques (Phase 5).
 *
 * <p>Deux scans periodiques :
 * <ul>
 *   <li><b>Toutes les heures</b> : alertes ACTIVE non acknowledged depuis &gt; 24h. Pour chacune,
 *       on logge une entree d'audit {@code ALERT_ESCALATION_24H} qui pourra etre consommee par
 *       le module Notifications (mail / SMS / WebSocket) en aval.</li>
 *   <li><b>Toutes les 6 heures</b> : dossiers de surexposition en statut OPEN depuis &gt; 48h.
 *       Trace via {@code CASE_ESCALATION_48H}.</li>
 * </ul>
 *
 * <p>Conformement au cahier des charges Phase 5, ce scheduler ne fait que LOGGER + AUDIT ;
 * l'envoi effectif des notifications (mail/SMS) sera branche par un consommateur du module
 * Notifications dans une phase ulterieure. Cela garantit qu'aucune notification ne peut etre
 * perdue meme si le canal externe est down.
 */
@Service
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationScheduler.class);

    /** Delai d'escalade des alertes ACTIVE non acknowledged. */
    static final long ALERT_ESCALATION_HOURS = 24L;

    /** Delai d'escalade des dossiers de surexposition OPEN. */
    static final long CASE_ESCALATION_HOURS = 48L;

    private final ExposureAlertRepository alertRepository;
    private final OverexposureCaseRepository caseRepository;
    private final DosimetryAuditService auditService;

    /**
     * Scan horaire des alertes ACTIVE non acknowledged depuis &gt; 24h.
     * Cron : a la minute 0 de chaque heure.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void scanStaleActiveAlerts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(ALERT_ESCALATION_HOURS);
        List<ExposureAlert> stale = alertRepository
                .findByStatusAndTriggeredAtBefore(AlertStatus.ACTIVE, cutoff);
        if (stale.isEmpty()) {
            LOGGER.debug("[NotificationScheduler] No stale ACTIVE alerts > 24h.");
            return;
        }
        LOGGER.warn("[NotificationScheduler] {} ACTIVE alert(s) > {}h without ACK.",
                stale.size(), ALERT_ESCALATION_HOURS);
        for (ExposureAlert a : stale) {
            String details = String.format(
                    "{\"alertId\":%d,\"workerId\":%d,\"level\":\"%s\",\"grandeur\":\"%s\","
                            + "\"triggeredAt\":\"%s\",\"ageHours\":%d}",
                    a.getId(), a.getWorkerId(),
                    a.getLevel() != null ? a.getLevel().name() : "null",
                    a.getGrandeur() != null ? a.getGrandeur().name() : "null",
                    a.getTriggeredAt(), ALERT_ESCALATION_HOURS);
            auditService.log("ALERT_ESCALATION_24H", "ExposureAlert", a.getId(),
                    0L, null, details);
        }
    }

    /**
     * Scan toutes les 6h des dossiers de surexposition OPEN depuis &gt; 48h.
     * Cron : a la minute 0, toutes les 6 heures (00:00, 06:00, 12:00, 18:00).
     */
    @Scheduled(cron = "0 0 0/6 * * *")
    public void scanStaleOpenCases() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(CASE_ESCALATION_HOURS);
        List<OverexposureCase> stale = caseRepository
                .findByStatusAndOpenedAtBefore(CaseStatus.OPEN, cutoff);
        if (stale.isEmpty()) {
            LOGGER.debug("[NotificationScheduler] No stale OPEN cases > 48h.");
            return;
        }
        LOGGER.warn("[NotificationScheduler] {} OPEN overexposure case(s) > {}h without investigation.",
                stale.size(), CASE_ESCALATION_HOURS);
        for (OverexposureCase c : stale) {
            Long workerId = c.getWorker() != null ? c.getWorker().getId() : null;
            String details = String.format(
                    "{\"caseId\":%d,\"workerId\":%s,\"level\":\"%s\",\"openedAt\":\"%s\","
                            + "\"ageHours\":%d}",
                    c.getId(), workerId != null ? workerId.toString() : "null",
                    c.getLevel() != null ? c.getLevel().name() : "null",
                    c.getOpenedAt(), CASE_ESCALATION_HOURS);
            auditService.log("CASE_ESCALATION_48H", "OverexposureCase", c.getId(),
                    0L, null, details);
        }
    }
}
