package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;

import com.minexpert.hns.blast.entity.Blast;

/**
 * Hook de planification persistante des rappels et alertes pour un tir.
 *
 * <p>Implementation effective branchee en Phase 3 (P3) — calcule les instants
 * exacts (T-24h, T-6h, T-30 min, popups T-2h, alerte T-10 min) et cree les
 * lignes correspondantes dans {@code blast_notification_job}.
 *
 * <p>Pour la Phase 1, l'implementation par defaut etait un no-op qui logge ; cela
 * permettait de valider {@code BlastService.confirm} sans dependre de la chaine
 * SMTP. En Phase 3, l'implementation reelle ecrit les jobs en BDD, gere
 * l'idempotence (pas de double insertion sur 2 appels successifs) et expose
 * cancel/reschedule pour annuler ou regenerer la chaine apres modification du
 * tir.
 */
public interface BlastNotificationPlanner {

    /**
     * Cree (ou recree apres annulation) les {@code blast_notification_job} d'un
     * tir confirme. Appel idempotent : si des jobs {@code SCHEDULED} existent
     * deja pour ce tir, l'implementation P3 ne dupliquera pas — l'appel est
     * silencieux et retourne sans rien faire (cf. {@code planFor}).
     */
    void scheduleForBlast(Blast blast);

    /**
     * Planifie effectivement la chaine de notifications pour un tir
     * (alias explicite de {@link #scheduleForBlast(Blast)}). Calcule les
     * instants T-24h, T-6h, T-30 min, T-10 min et la serie de popups
     * T-2h -> T-0 a cadence configurable. Idempotent.
     */
    void planFor(Long blastId);

    /**
     * Annule toutes les notifications {@code SCHEDULED} d'un tir en passant
     * leur statut a {@code CANCELLED}. Sans effet sur les jobs deja
     * {@code SENT} / {@code FAILED} / {@code CANCELLED}.
     */
    void cancelFor(Long blastId);

    /**
     * Replanifie la chaine de notifications apres un changement d'horaire :
     * equivaut a {@link #cancelFor(Long)} suivi de {@link #planFor(Long)}.
     */
    void rescheduleFor(Long blastId, LocalDateTime newDateTime);
}
