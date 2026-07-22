package com.minexpert.hns.service.notification;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.minexpert.hns.entity.audit.Recommendation;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.HseNotificationSeverity;
import com.minexpert.hns.enums.HseNotificationType;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.repository.audit.RecommendationRepository;
import com.minexpert.hns.repository.incident.CorrectiveActionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Moteur SLA / escalade HSE (ISO 45001 §9.1 surveillance — §10.2 délais de
 * traitement). Balaye périodiquement les échéances des actions correctives et
 * des recommandations d'audit et émet des notifications idempotentes :
 * <ul>
 *   <li>bientôt due → rappel au responsable ;</li>
 *   <li>échéance dépassée → alerte au responsable ;</li>
 *   <li>retard prolongé (≥ seuil) → escalade à la coordination HSE de la mine.</li>
 * </ul>
 *
 * <p><b>Sûr par défaut :</b> {@code @ConditionalOnProperty(hse.sla.enabled=true)}
 * — le planificateur n'est même pas instancié tant qu'il n'est pas activé
 * explicitement. Le fil in-app est consultable par polling ; il n'y a pas de
 * diffusion temps réel (les alertes de délai ne sont pas à la seconde).
 *
 * <p><b>Anti-envoi massif (e-mail) :</b> l'e-mail n'est envoyé QUE pour une
 * notification RÉELLEMENT nouvelle ({@code raise() == true}), seulement si la
 * rupture est RÉCENTE ({@code email-max-age-days}), et dans la limite d'un
 * BUDGET par balayage ({@code max-emails-per-scan}). À la première activation sur
 * une mine au gros arriéré, le fil se remplit (idempotent, sans effet externe)
 * mais l'e-mail reste plafonné. La résolution HRMS de l'adresse n'a lieu que
 * lorsqu'un envoi est réellement possible (jamais sur une ligne déjà notifiée).
 *
 * <p><b>Multi-mine :</b> requête de balayage globale (lignes de toutes les mines,
 * chacune estampillée de son {@code companyId}) ; isolation des échecs par
 * élément (try/catch), à l'image de {@code SosEscalationScheduler}.
 */
@Service
@ConditionalOnProperty(name = "hse.sla.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class SlaEscalationScheduler {

    private static final Logger LOG = LoggerFactory.getLogger(SlaEscalationScheduler.class);

    /** Statuts terminaux : une action clôturée n'a plus de SLA (cf. Dashboard). */
    private static final Set<ActionStatus> CLOSED_ACTIONS =
            EnumSet.of(ActionStatus.COMPLETED, ActionStatus.CANCELLED, ActionStatus.VERIFIED);
    private static final Set<RecommendationStatus> CLOSED_RECOMMENDATIONS =
            EnumSet.of(RecommendationStatus.COMPLETED);

    private final CorrectiveActionRepository correctiveActionRepository;
    private final RecommendationRepository recommendationRepository;
    private final HseNotificationService notificationService;

    @Value("${hse.sla.due-soon-days:3}")
    private int dueSoonDays;
    @Value("${hse.sla.escalation-days:7}")
    private int escalationDays;
    /** Ne pas relancer d'e-mail pour une rupture plus vieille que ce seuil (anti-arriéré). */
    @Value("${hse.sla.email-max-age-days:30}")
    private int emailMaxAgeDays;
    /** Plafond d'e-mails par balayage (garde-fou anti-envoi massif). */
    @Value("${hse.sla.max-emails-per-scan:50}")
    private int maxEmailsPerScan;

    // Défaut : tous les jours à 07:00. Surcouchable via hse.sla.cron.
    @Scheduled(cron = "${hse.sla.cron:0 0 7 * * *}")
    public void scan() {
        try {
            LocalDate today = LocalDate.now();
            int[] emailBudget = { Math.max(maxEmailsPerScan, 0) };
            int actions = scanCorrectiveActions(today, emailBudget);
            int recs = scanRecommendations(today, emailBudget);
            LOG.info("[SLA] balayage terminé — {} action(s) + {} recommandation(s) ; budget e-mail restant {}.",
                    actions, recs, emailBudget[0]);
        } catch (Exception e) {
            // Ne JAMAIS laisser une exception tuer le thread du planificateur.
            LOG.error("[SLA] échec du balayage : {}", e.getMessage(), e);
        }
    }

    private int scanCorrectiveActions(LocalDate today, int[] emailBudget) {
        int handled = 0;
        // Bientôt dues : échéance dans [today, today+dueSoonDays] (intrinsèquement récent).
        LocalDate soonUntil = today.plusDays(Math.max(dueSoonDays, 0));
        for (CorrectiveAction a : safe(correctiveActionRepository.findActionsDueSoon(today, soonUntil, CLOSED_ACTIONS))) {
            try {
                Long recipient = recipientOf(a.getOwnerId(), a.getAssignedEmployeeId());
                long inDays = ChronoUnit.DAYS.between(today, a.getDeadline());
                boolean isNew = notificationService.raise(a.getCompanyId(), recipient,
                        HseNotificationType.ACTION_DUE_SOON, HseNotificationSeverity.INFO,
                        "CORRECTIVE_ACTION", a.getId(),
                        "Action corrective à échéance proche",
                        label(a.getActionName()) + " — échéance le " + a.getDeadline() + " (dans " + inDays + " j).",
                        "ACTION_DUE_SOON:" + a.getId() + ":" + a.getDeadline());
                maybeEmail(isNew, true, recipient, emailBudget,
                        "Action corrective à échéance proche",
                        label(a.getActionName()) + " — échéance le " + a.getDeadline() + ".");
                handled++;
            } catch (Exception e) {
                LOG.warn("[SLA] action bientôt due ignorée (id {}): {}", a.getId(), e.getMessage());
            }
        }
        // En retard : échéance < today.
        for (CorrectiveAction a : safe(correctiveActionRepository.findOverdueActions(today, CLOSED_ACTIONS))) {
            try {
                Long recipient = recipientOf(a.getOwnerId(), a.getAssignedEmployeeId());
                long overdue = ChronoUnit.DAYS.between(a.getDeadline(), today);
                boolean escalate = overdue >= escalationDays;
                boolean isNew = notificationService.raise(a.getCompanyId(), recipient,
                        HseNotificationType.ACTION_OVERDUE,
                        escalate ? HseNotificationSeverity.CRITICAL : HseNotificationSeverity.WARNING,
                        "CORRECTIVE_ACTION", a.getId(),
                        "Action corrective en retard",
                        label(a.getActionName()) + " — échéance dépassée le " + a.getDeadline()
                                + " (" + overdue + " j de retard).",
                        "ACTION_OVERDUE:" + a.getId() + ":" + a.getDeadline());
                // E-mail seulement si récent (anti-arriéré) et sous budget.
                maybeEmail(isNew && overdue <= emailMaxAgeDays, true, recipient, emailBudget,
                        "Action corrective en retard",
                        label(a.getActionName()) + " — en retard de " + overdue + " j.");
                if (escalate) {
                    // Escalade coordination HSE : fil de la mine uniquement (recipientId nul,
                    // pas d'e-mail — la cible est l'équipe, pas le responsable de l'action).
                    notificationService.raise(a.getCompanyId(), null,
                            HseNotificationType.ACTION_OVERDUE_ESCALATED, HseNotificationSeverity.CRITICAL,
                            "CORRECTIVE_ACTION", a.getId(),
                            "Escalade — action corrective en retard prolongé",
                            label(a.getActionName()) + " est en retard de " + overdue
                                    + " j (seuil " + escalationDays + " j). Intervention de la coordination HSE requise.",
                            "ACTION_OVERDUE_ESC:" + a.getId() + ":" + a.getDeadline());
                }
                handled++;
            } catch (Exception e) {
                LOG.warn("[SLA] action en retard ignorée (id {}): {}", a.getId(), e.getMessage());
            }
        }
        return handled;
    }

    private int scanRecommendations(LocalDate today, int[] emailBudget) {
        int handled = 0;
        for (Recommendation r : safe(recommendationRepository.findOverdueRecommendations(today, CLOSED_RECOMMENDATIONS))) {
            try {
                long overdue = ChronoUnit.DAYS.between(r.getDeadline(), today);
                boolean escalate = overdue >= escalationDays;
                boolean isNew = notificationService.raise(r.getCompanyId(), r.getActionManagerId(),
                        HseNotificationType.RECOMMENDATION_OVERDUE,
                        escalate ? HseNotificationSeverity.CRITICAL : HseNotificationSeverity.WARNING,
                        "RECOMMENDATION", r.getId(),
                        "Recommandation d'audit en retard",
                        label(r.getTitle()) + " — échéance dépassée le " + r.getDeadline()
                                + " (" + overdue + " j de retard).",
                        "RECOMMENDATION_OVERDUE:" + r.getId() + ":" + r.getDeadline());
                maybeEmail(isNew && overdue <= emailMaxAgeDays, true, r.getActionManagerId(), emailBudget,
                        "Recommandation d'audit en retard",
                        label(r.getTitle()) + " — en retard de " + overdue + " j.");
                if (escalate) {
                    notificationService.raise(r.getCompanyId(), null,
                            HseNotificationType.RECOMMENDATION_OVERDUE_ESCALATED, HseNotificationSeverity.CRITICAL,
                            "RECOMMENDATION", r.getId(),
                            "Escalade — recommandation d'audit en retard prolongé",
                            label(r.getTitle()) + " est en retard de " + overdue
                                    + " j (seuil " + escalationDays + " j). Intervention de la coordination HSE requise.",
                            "RECOMMENDATION_OVERDUE_ESC:" + r.getId() + ":" + r.getDeadline());
                }
                handled++;
            } catch (Exception e) {
                LOG.warn("[SLA] recommandation en retard ignorée (id {}): {}", r.getId(), e.getMessage());
            }
        }
        return handled;
    }

    /**
     * E-mail conditionnel : seulement pour une notification réellement nouvelle
     * ({@code eligible}), à un destinataire, et tant qu'il reste du budget. Consomme
     * le budget uniquement si un envoi a effectivement été tenté.
     */
    private void maybeEmail(boolean eligible, boolean owner, Long recipient, int[] emailBudget,
            String subject, String message) {
        if (!eligible || !owner || recipient == null || emailBudget[0] <= 0) {
            return;
        }
        if (notificationService.emailRecipient(recipient, subject, message)) {
            emailBudget[0]--;
        }
    }

    private static <T> List<T> safe(List<T> list) {
        return list != null ? list : List.of();
    }

    private static Long recipientOf(Long owner, Long assignee) {
        return owner != null ? owner : assignee;
    }

    private static String label(String s) {
        return (s != null && !s.isBlank()) ? s : "(sans intitulé)";
    }
}
