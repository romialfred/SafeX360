package com.minexpert.hns.dosimetry.config;

/**
 * Catalogue centralise des permissions RBAC du module Dosimetrie.
 *
 * <p>Ces constantes sont referencees dans les annotations Spring Security
 * ({@code @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")}
 * ou regles dans {@code SecurityConfig}) et garantissent qu'aucun "magic string" RBAC ne traine
 * dans les controleurs.
 *
 * <p><b>Mapping roles -&gt; permissions (cible) :</b>
 *
 * <ul>
 *   <li><b>HSE_MANAGER / WORKFORCE_MANAGER</b> : {@link #DOSIMETRY_READ_AGGREGATE} - acces aux
 *       indicateurs agreges, KPI, statistiques sans nominatif.</li>
 *   <li><b>RPO</b> (Radiation Protection Officer / Personne Competente en Radioprotection) :
 *       {@link #DOSIMETRY_READ_AGGREGATE}, {@link #DOSIMETRY_READ_NOMINATIVE},
 *       {@link #DOSIMETRY_WRITE}, {@link #DOSIMETRY_PCR_RPO}. Acces nominatif aux doses,
 *       gestion des seuils, alertes, dossiers de surexposition.</li>
 *   <li><b>OCCUPATIONAL_PHYSICIAN</b> (medecin du travail) : {@link #DOSIMETRY_MEDICAL}.
 *       Seul role autorise a lire/ecrire {@code restrictedClinicalDetails} (chiffre AES).</li>
 *   <li><b>EXPOSED_WORKER</b> (utilisateur lie a un ExposedWorker) : {@link #DOSIMETRY_READ_NOMINATIVE}
 *       restreint a ses PROPRES donnees uniquement (filtre applicatif par workerId).</li>
 *   <li><b>HSE_ADMIN</b> : {@link #DOSIMETRY_ADMIN} - administration du parc dosimetres,
 *       configuration des seuils, parametrage des notifications.</li>
 * </ul>
 *
 * <p>Toute lecture nominative ({@link #DOSIMETRY_READ_NOMINATIVE} ou
 * {@link #DOSIMETRY_MEDICAL}) DOIT etre tracee dans {@code dosimetry_audit_log} avec
 * {@code action = VIEW_NOMINATIVE_DOSE} ou {@code VIEW_MEDICAL_DATA} (cf. AIEA GSR Part 3 §3.106
 * et RGPD art. 30).
 */
public final class DosimetryRBACConfig {

    /** Lecture des donnees dosimetriques agregees (KPI, statistiques sans nominatif). */
    public static final String DOSIMETRY_READ_AGGREGATE = "DOSIMETRY_READ_AGGREGATE";

    /**
     * Lecture nominative des doses (DoseRecord, DoseCumulative, alertes par travailleur).
     * Reserve RPO et travailleur lui-meme (sur ses propres donnees). Trace audit obligatoire.
     */
    public static final String DOSIMETRY_READ_NOMINATIVE = "DOSIMETRY_READ_NOMINATIVE";

    /**
     * Ecriture des donnees operationnelles : saisie/import de doses, gestion des dosimetres,
     * affectations, profils d'exposition, qualifications. Reserve RPO et HSE_ADMIN.
     */
    public static final String DOSIMETRY_WRITE = "DOSIMETRY_WRITE";

    /**
     * Acces aux donnees medicales sensibles : lecture/ecriture de
     * {@code MedicalSurveillance.restrictedClinicalDetails} et decisions medicales
     * d'OverexposureCase. STRICTEMENT reserve au medecin du travail (champ chiffre AES-256).
     */
    public static final String DOSIMETRY_MEDICAL = "DOSIMETRY_MEDICAL";

    /**
     * Permission specifique au role PCR/RPO pour les actions reglementaires : acquittement
     * d'alertes ACTION_LEVEL/EXCEEDED, ouverture/cloture d'OverexposureCase, declaration
     * autorite. Distinct de WRITE pour permettre une separation des devoirs (4 yeux).
     */
    public static final String DOSIMETRY_PCR_RPO = "DOSIMETRY_PCR_RPO";

    /**
     * Administration du module : seuils (Threshold), referentiels (CIPR/AIEA),
     * parametrage des notifications, purge/archivage. Reserve HSE_ADMIN.
     */
    public static final String DOSIMETRY_ADMIN = "DOSIMETRY_ADMIN";

    /**
     * Permission specifique pour l'export de donnees medicales (Phase 7). STRICTEMENT plus
     * restrictive que {@link #DOSIMETRY_MEDICAL} : tout export doit etre justifie (parametre
     * {@code reason} obligatoire) et systematiquement audite avec entree
     * {@code EXPORT_MEDICAL_DATA}. Permet de tracer separement "consultation" et "export"
     * pour les revues RGPD (registre des traitements, art. 30).
     */
    public static final String DOSIMETRY_EXPORT_MEDICAL = "DOSIMETRY_EXPORT_MEDICAL";

    private DosimetryRBACConfig() {
        // Constants holder - no instances.
    }
}
