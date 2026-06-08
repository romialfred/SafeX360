package com.minexpert.hns.blast.config;

/**
 * Catalogue centralise des permissions RBAC du module Blast Management.
 *
 * <p>Constantes referencees dans les annotations Spring Security {@code @PreAuthorize}.
 *
 * <p><b>Mapping roles -&gt; permissions (cible) :</b>
 * <ul>
 *   <li><b>OPERATIONS_MANAGER, HSE_LEAD</b> : {@link #BLAST_VIEW} — consultation du registre,
 *       tableau de bord, rapports.</li>
 *   <li><b>BLAST_PLANNER</b> (responsable des operations / chef de tir junior) :
 *       {@link #BLAST_VIEW}, {@link #BLAST_PLAN} — creation, edition, brouillons.</li>
 *   <li><b>SHOTFIRER</b> (boutefeu agree) : {@link #BLAST_VIEW}, {@link #BLAST_PLAN},
 *       {@link #BLAST_CONFIRM} — verrouille un tir, declare un tir tire ou rate,
 *       prononce le site degage.</li>
 *   <li><b>CONTROL_ROOM</b> : {@link #BLAST_ALARM} — declenchement / arret de l'Alerte
 *       Generale a T-10.</li>
 *   <li><b>HSE_OFFICER</b> : {@link #BLAST_VIEW}, {@link #BLAST_REPORT} — signe les
 *       rapports d'evacuation post-tir.</li>
 *   <li><b>BLAST_ADMIN</b> : toutes les permissions, dont {@link #BLAST_ADMIN}
 *       — modifier les parametres mine, resoudre un misfire, modifier un tir
 *       confirme avec raison tracee.</li>
 * </ul>
 *
 * <p>Reference cahier des charges : §9 (Securite, fiabilite, conformite) — seuls
 * les roles habilites peuvent confirmer un tir, lancer ou arreter l'alerte.
 */
public final class BlastRBACConfig {

    /** Lecture : registre des tirs, tableau de bord, detail d'un tir, rapports. */
    public static final String BLAST_VIEW = "BLAST_VIEW";

    /**
     * Planification : creation d'un tir (status DRAFT), edition tant que non confirme,
     * report (reschedule), annulation. Permet aussi de modifier les destinataires
     * et les gardes.
     */
    public static final String BLAST_PLAN = "BLAST_PLAN";

    /**
     * Verrouillage et execution : confirmation d'un tir (DRAFT/PLANNED -&gt; CONFIRMED),
     * declaration "tire" (FIRED), declaration de rate (MISFIRE), prononce "site degage"
     * (ALL_CLEAR). Strictement reserve aux boutefeux agrees.
     */
    public static final String BLAST_CONFIRM = "BLAST_CONFIRM";

    /**
     * Pilotage de l'Alerte Generale a T-10 : declenchement manuel anticipe, arret
     * autorise apres le tir. Strictement reserve a la salle de controle.
     */
    public static final String BLAST_ALARM = "BLAST_ALARM";

    /**
     * Rapports d'evacuation : redaction, signature, export. Reserve HSE.
     */
    public static final String BLAST_REPORT = "BLAST_REPORT";

    /**
     * Administration du module : parametres mine (offsets de rappels, SMTP, timezone),
     * resolution de misfire, override d'un tir confirme (avec raison tracee), purge.
     */
    public static final String BLAST_ADMIN = "BLAST_ADMIN";

    private BlastRBACConfig() {
        // Constants holder - no instances.
    }
}
