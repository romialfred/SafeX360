package com.minexpert.hns.blast.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.minexpert.hns.blast.entity.Blast;

/**
 * Implementation no-op du planner de notifications pour la Phase 1.
 *
 * <p>Logge l'invocation et n'ecrit rien dans {@code blast_notification_job}.
 * Sera remplacee par une implementation reelle en Phase 3 (calcul des
 * echeances T-24h / T-6h / T-30 min / popups / alerte T-10 et persistance
 * comme jobs ordonnances).
 */
@Component
public class BlastNotificationPlannerNoop implements BlastNotificationPlanner {

    private static final Logger LOGGER = LoggerFactory.getLogger(BlastNotificationPlannerNoop.class);

    @Override
    public void scheduleForBlast(Blast blast) {
        LOGGER.info("[BlastNotificationPlanner] (no-op P1) blast id={} ref={} scheduledAt={}"
                        + " : notifications will be wired in Phase 3.",
                blast.getId(), blast.getReference(), blast.getScheduledAt());
    }
}
