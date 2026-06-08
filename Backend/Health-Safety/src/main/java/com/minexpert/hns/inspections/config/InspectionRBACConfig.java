package com.minexpert.hns.inspections.config;

/**
 * Catalogue centralise des permissions RBAC du module Inspections HSE (refonte 2026-06).
 *
 * <p>Constantes referencees dans les annotations Spring Security
 * {@code @PreAuthorize} sur les controllers.</p>
 *
 * <p><b>Mapping roles -&gt; permissions (cible) :</b></p>
 * <ul>
 *   <li><b>HSE_OBSERVER, OPERATIONS_MANAGER</b> : {@link #INSPECTION_VIEW} —
 *       consultation du registre, detail, rapport (lecture seule).</li>
 *   <li><b>INSPECTION_PLANNER</b> (responsable HSE) : {@link #INSPECTION_VIEW},
 *       {@link #INSPECTION_PLAN} — planifie une inspection sur une cible avec
 *       un template (web ou mobile).</li>
 *   <li><b>FIELD_INSPECTOR</b> (inspecteur terrain) : {@link #INSPECTION_VIEW},
 *       {@link #INSPECTION_EXECUTE} — saisit les findings sur mobile/tablette,
 *       soumet pour validation.</li>
 *   <li><b>HSE_REVIEWER</b> (membre de l'equipe de validation) :
 *       {@link #INSPECTION_VIEW}, {@link #INSPECTION_VALIDATE} — approuve ou
 *       rejette une inspection soumise. Une fois 100% approuvee, le rapport
 *       est fige et archive.</li>
 *   <li><b>TEMPLATE_MANAGER</b> (expert metier) :
 *       {@link #INSPECTION_TEMPLATE_MANAGE} — gere la bibliotheque de templates
 *       et leurs points de controle (referentiels reutilisables).</li>
 *   <li><b>INSPECTION_ADMIN</b> : toutes les permissions, dont
 *       {@link #INSPECTION_ADMIN} — purge, override d'une inspection archivee
 *       (avec raison tracee), reset workflow.</li>
 * </ul>
 */
public final class InspectionRBACConfig {

    /** Lecture : registre, detail inspection, findings, rapport, templates. */
    public static final String INSPECTION_VIEW = "INSPECTION_VIEW";

    /**
     * Planification : creation d'une inspection (status SCHEDULED), choix du
     * template, choix de la cible, equipe d'inspecteurs, date planifiee.
     * Edition possible tant que non soumise.
     */
    public static final String INSPECTION_PLAN = "INSPECTION_PLAN";

    /**
     * Execution terrain : passage IN_PROGRESS, saisie des findings sur
     * mobile/tablette, prise de photos, soumission pour validation (SUBMITTED).
     * Reserve aux inspecteurs habilites sur la cible.
     */
    public static final String INSPECTION_EXECUTE = "INSPECTION_EXECUTE";

    /**
     * Validation collegiale : approuver ou rejeter une inspection soumise.
     * Une fois 100% des approbations recoltees, l'inspection passe APPROVED
     * et est archivee automatiquement. Au moindre rejet, retour IN_PROGRESS.
     */
    public static final String INSPECTION_VALIDATE = "INSPECTION_VALIDATE";

    /**
     * Gestion des templates : creation/edition/archivage d'un modele
     * d'inspection et de ses points de controle (referentiel reutilisable).
     */
    public static final String INSPECTION_TEMPLATE_MANAGE = "INSPECTION_TEMPLATE_MANAGE";

    /**
     * Administration du module : purge, override d'une inspection archivee,
     * recuperation d'un brouillon orphelin, reparametrage workflow.
     */
    public static final String INSPECTION_ADMIN = "INSPECTION_ADMIN";

    private InspectionRBACConfig() {
        // Constants holder - no instances.
    }
}
