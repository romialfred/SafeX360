package com.minexpert.hns.blast.enums;

/**
 * Etat d'une tache de notification ({@link com.minexpert.hns.blast.entity.BlastNotificationJob}).
 *
 * <ul>
 *   <li>{@link #SCHEDULED} : programmee, en attente de l'echeance.</li>
 *   <li>{@link #SENT} : execution reussie (e-mail parti / popup poussee / alerte declenchee).</li>
 *   <li>{@link #FAILED} : echec apres epuisement des tentatives.</li>
 *   <li>{@link #CANCELLED} : annulee suite a annulation / report du tir.</li>
 * </ul>
 */
public enum JobStatus {
    SCHEDULED,
    SENT,
    FAILED,
    CANCELLED
}
