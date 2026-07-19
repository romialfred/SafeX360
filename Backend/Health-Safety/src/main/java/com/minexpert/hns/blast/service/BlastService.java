package com.minexpert.hns.blast.service;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.blast.dto.BlastCreateDTO;
import com.minexpert.hns.blast.dto.BlastDetailDTO;
import com.minexpert.hns.blast.dto.BlastListItemDTO;
import com.minexpert.hns.blast.dto.BlastSearchFiltersDTO;
import com.minexpert.hns.blast.dto.BlastUpdateDTO;

/**
 * Service metier du module Blast Management : creation, edition, workflow
 * (confirmation, annulation, report, tir, site degage), recherches.
 *
 * <p>Les transitions de statut sont controlees par {@code assertTransition}
 * dans l'implementation. Chaque transition est journalisee dans
 * {@code blast_status_event} via {@link BlastAuditService}.
 */
public interface BlastService {

    /**
     * Cree un tir en statut {@code DRAFT}. Si {@code reference} est absente,
     * une reference {@code BLT-YYYY-NNNN} est generee automatiquement.
     */
    Long create(BlastCreateDTO dto, Long userId);

    /**
     * Met a jour les champs metier d'un tir. Autorise sur DRAFT et PLANNED sans
     * raison. Sur CONFIRMED, exige un appelant {@code adminOverride=true}, une
     * version optimiste courante et {@code dto.reason} non vide. Cette action
     * annule la confirmation et replace le tir en PLANNED ; une nouvelle
     * confirmation est obligatoire avant toute notification opérationnelle.
     */
    void update(BlastUpdateDTO dto, Long userId, boolean adminOverride);

    /**
     * Verrouille un tir : DRAFT/PLANNED -&gt; CONFIRMED. Declenche la
     * planification persistante des rappels et alertes (hook P3 — appel
     * idempotent du scheduler, no-op tant que le job de planification n'est
     * pas branche).
     */
    void confirm(Long id, Long userId);

    /**
     * Annule un tir : DRAFT/PLANNED/CONFIRMED/IMMINENT/POSTPONED -&gt; CANCELLED.
     * {@code reason} obligatoire. Annule toutes les taches {@code SCHEDULED}.
     */
    void cancel(Long id, String reason, Long userId);

    /**
     * Reprogramme un tir : passe en {@code POSTPONED} puis {@code PLANNED} avec
     * une nouvelle heure prevue. Annule les notifications precedentes (recalcul
     * effectif branche en P3).
     */
    void reschedule(Long id, LocalDateTime newScheduledAt, String reason, Long userId);

    /**
     * Declare qu'un tir a ete tire : IMMINENT -&gt; FIRED. Si aucune popup ou
     * alerte n'a pu se declencher, le passage IMMINENT est valide cote service
     * par le scheduler P3 ; ici on autorise aussi CONFIRMED -&gt; FIRED en cas
     * de tir avance manuellement.
     */
    void declareFired(Long id, Long userId);

    /**
     * Declare un rate : IMMINENT/FIRED -&gt; MISFIRE. Bloque toute transition
     * vers ALL_CLEAR tant que {@code misfireResolvedAt} n'est pas renseigne.
     */
    void declareMisfire(Long id, String reason, Long userId);

    /**
     * Leve le verrou misfire (BLAST_ADMIN seul). Renseigne {@code misfireResolvedAt}
     * et persiste {@code misfireResolutionNotes} (protocole d'intervention :
     * deminage manuel, re-amorcage, contre-mine, etc.). Apres cet appel, la
     * transition MISFIRE -&gt; ALL_CLEAR est autorisee.
     *
     * @param id              id du tir
     * @param resolutionNotes texte libre decrivant le protocole applique
     *                        (peut etre null/blank ; conserve en colonne
     *                        {@code misfire_resolution_notes} si renseigne,
     *                        et trace dans {@code blast_status_event}).
     * @param userId          id de l'admin qui leve le verrou
     */
    void resolveMisfire(Long id, String resolutionNotes, Long userId);

    /**
     * Prononce le "site degage" : FIRED -&gt; ALL_CLEAR ; ou MISFIRE -&gt;
     * ALL_CLEAR uniquement si {@code misfireResolvedAt != null}.
     */
    void allClear(Long id, Long userId);

    /** Recherche dans le registre selon les filtres. */
    List<BlastListItemDTO> search(BlastSearchFiltersDTO filters);

    /** Vue detaillee d'un tir. */
    BlastDetailDTO getDetail(Long id);

    // ── Surcharges cloisonnees par mine (companyId) ─────────────────────────
    // Le param companyId (valide par CompanyScopeFilter) verifie l'appartenance
    // du tir a la mine appelante avant toute mutation. companyId null = pas de
    // controle (appel systeme / allMines). Les surcharges historiques (sans
    // companyId) restent en place pour la retrocompat (schedulers, tests).

    /** Vue detaillee avec verification d'appartenance a la mine. */
    default BlastDetailDTO getDetail(Long id, Long companyId) {
        return getDetail(id);
    }

    default void update(BlastUpdateDTO dto, Long userId, boolean adminOverride, Long companyId) {
        update(dto, userId, adminOverride);
    }

    default void confirm(Long id, Long userId, Long companyId) {
        confirm(id, userId);
    }

    default void cancel(Long id, String reason, Long userId, Long companyId) {
        cancel(id, reason, userId);
    }

    default void reschedule(Long id, LocalDateTime newScheduledAt, String reason,
            Long userId, Long companyId) {
        reschedule(id, newScheduledAt, reason, userId);
    }

    default void declareFired(Long id, Long userId, Long companyId) {
        declareFired(id, userId);
    }

    default void declareMisfire(Long id, String reason, Long userId, Long companyId) {
        declareMisfire(id, reason, userId);
    }

    default void resolveMisfire(Long id, String resolutionNotes, Long userId, Long companyId) {
        resolveMisfire(id, resolutionNotes, userId);
    }

    default void allClear(Long id, Long userId, Long companyId) {
        allClear(id, userId);
    }
}
