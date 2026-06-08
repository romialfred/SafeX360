package com.minexpert.hns.blast.service;

import com.minexpert.hns.blast.entity.Blast;

/**
 * Hook de planification persistante des rappels et alertes pour un tir.
 *
 * <p>Implementation effective branchee en Phase 3 (P3) — calcule les instants
 * exacts (T-24h, T-6h, T-30 min, popups T-2h, alerte T-10 min) et cree les
 * lignes correspondantes dans {@code blast_notification_job}.
 *
 * <p>Pour la Phase 1, l'implementation par defaut est un no-op qui logge ; cela
 * permet de valider {@code BlastService.confirm} sans dependre de la chaine
 * SMTP. Le contrat est defini ici pour stabiliser le design.
 */
public interface BlastNotificationPlanner {

    /**
     * Cree (ou recree apres annulation) les {@code blast_notification_job} d'un
     * tir confirme. Appel idempotent : si des jobs SCHEDULED existent deja
     * pour ce tir, l'implementation P3 ne dupliquera pas.
     */
    void scheduleForBlast(Blast blast);
}
