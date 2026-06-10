/**
 * Libellés et conventions FR du domaine Incidents / Investigations / Leçons apprises.
 *
 * Le backend conserve des codes historiques en anglais (statuts d'incident,
 * statuts d'action corrective, échelles probabilité/gravité). Toute la
 * traduction est centralisée ici, sur le modèle de complianceLabels.ts :
 * un seul endroit à maintenir pour l'ensemble des pages du domaine.
 *
 * IMPORTANT : seuls les libellés affichés sont traduits — les codes envoyés
 * au backend (values) restent strictement identiques.
 */

// ─── Statuts d'incident (workflow ISO 45001 §10.2) ─────────────────────────

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    REPORTED: 'Déclaré',
    ANALYSIS: 'En analyse',
    INVESTIGATION: 'Investigation',
    IN_INVESTIGATION: 'Investigation',
    INVESTIGATION_COMPLETED: 'Investigation terminée',
    CORRECTIVE_ACTIONS: 'Actions correctives en cours',
    ACTION_TAKEN: 'Actions engagées',
    CLOSED: 'Clôturé',
    REJECTED: 'Rejeté',
    CANCELLED: 'Annulé',
};

/** Libellé FR d'un statut d'incident, avec repli sur le code brut. */
export const incidentStatusLabel = (code?: string | null): string =>
    code ? INCIDENT_STATUS_LABELS[String(code).toUpperCase()] ?? code : '—';

/**
 * Options FR pour les <Select> de statut d'incident.
 * Mêmes valeurs backend que Data/DropdownData (incidentStatuses).
 */
export const INCIDENT_STATUS_OPTIONS = [
    { label: 'En attente', value: 'PENDING' },
    { label: 'Déclaré', value: 'REPORTED' },
    { label: 'Investigation', value: 'INVESTIGATION' },
    { label: 'Investigation terminée', value: 'INVESTIGATION_COMPLETED' },
    { label: 'Actions correctives en cours', value: 'CORRECTIVE_ACTIONS' },
    { label: 'Clôturé', value: 'CLOSED' },
    { label: 'Rejeté', value: 'REJECTED' },
];

// ─── Statuts d'action corrective / process d'investigation ─────────────────

export const ACTION_STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    CANCELED: 'Annulée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée',
    ON_HOLD: 'Suspendue',
};

/** Libellé FR d'un statut d'action, avec repli sur le code brut. */
export const actionStatusLabel = (code?: string | null): string =>
    code ? ACTION_STATUS_LABELS[String(code).toUpperCase()] ?? code : '—';

/** Couleurs Mantine par statut d'action (palette charte R7). */
export const ACTION_STATUS_COLORS: Record<string, string> = {
    PENDING: 'violet',     // en attente
    IN_PROGRESS: 'yellow', // en cours (amber)
    CANCELED: 'gray',
    CANCELLED: 'gray',
    COMPLETED: 'green',    // approuvé / terminé
    ON_HOLD: 'orange',
};

export const actionStatusColor = (code?: string | null): string =>
    ACTION_STATUS_COLORS[String(code ?? '').toUpperCase()] ?? 'gray';

/**
 * Options FR pour les <Select> de statut d'action corrective des formulaires
 * incident (valeur backend CANCELED — orthographe historique conservée).
 */
export const ACTION_STATUS_OPTIONS = [
    { label: 'En attente', value: 'PENDING' },
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Annulée', value: 'CANCELED' },
    { label: 'Terminée', value: 'COMPLETED' },
];

// ─── Échelles de risque (probabilité × gravité, ISO 31000) ─────────────────

export const PROBABILITY_OPTIONS = [
    { label: '1 - Très improbable', value: '1' },
    { label: '2 - Improbable', value: '2' },
    { label: '3 - Possible', value: '3' },
    { label: '4 - Probable', value: '4' },
    { label: '5 - Très probable', value: '5' },
];

export const PROBABILITY_LABELS: Record<string, string> = {
    '1': 'Très improbable',
    '2': 'Improbable',
    '3': 'Possible',
    '4': 'Probable',
    '5': 'Très probable',
};

export const SEVERITY_OPTIONS = [
    { label: '1 - Négligeable', value: '1' },
    { label: '2 - Mineure', value: '2' },
    { label: '3 - Modérée', value: '3' },
    { label: '4 - Majeure', value: '4' },
    { label: '5 - Catastrophique', value: '5' },
];

export const SEVERITY_LABELS: Record<string, string> = {
    '1': 'Négligeable',
    '2': 'Mineure',
    '3': 'Modérée',
    '4': 'Majeure',
    '5': 'Catastrophique',
};

/** Niveau de risque résultant (affichage simple par gravité). */
export const RISK_LEVEL_LABELS: Record<string, string> = {
    '1': 'Faible',
    '2': 'Faible',
    '3': 'Modéré',
    '4': 'Modéré',
    '5': 'Élevé',
};

// ─── EPI (codes historiques du backend) ─────────────────────────────────────

export const PPE_LABELS: Record<string, string> = {
    helmet: 'Casque de sécurité',
    goggles: 'Lunettes de protection',
    gloves: 'Gants de protection',
    boots: 'Chaussures de sécurité',
    vest: 'Gilet haute visibilité',
    mask: 'Masque respiratoire',
    harness: 'Harnais antichute',
    earplugs: 'Bouchons auditifs',
    faceshield: 'Visière',
    coverall: 'Combinaison ignifuge',
    apron: 'Tablier de protection',
    lanyard: 'Longe avec absorbeur',
    kneepads: 'Genouillères',
};

// ─── Rôles d'équipe d'investigation (valeurs backend EN conservées) ────────

export const INVESTIGATION_ROLE_OPTIONS = [
    { value: 'Lead Investigator', label: 'Enquêteur principal' },
    { value: 'Scribe', label: 'Secrétaire de séance' },
    { value: 'Subject Matter Expert', label: 'Expert métier' },
    { value: 'Observer', label: 'Observateur' },
    { value: 'Supervisor', label: 'Superviseur' },
    { value: 'Safety Officer', label: 'Responsable sécurité' },
];

export const INVESTIGATION_ROLE_LABELS: Record<string, string> = Object.fromEntries(
    INVESTIGATION_ROLE_OPTIONS.map((o) => [o.value, o.label]),
);

// ─── Causes ICAM (valeurs backend EN conservées, affichage FR) ─────────────

export const HUMAN_CAUSE_OPTIONS = [
    { value: 'Errors', label: 'Erreurs' },
    { value: 'Procedural violations', label: 'Violations de procédure' },
    { value: 'Fatigue', label: 'Fatigue' },
    { value: 'Distraction', label: 'Distraction' },
    { value: 'Work overload', label: 'Surcharge de travail' },
    { value: 'Insufficient training or skills', label: 'Formation ou compétences insuffisantes' },
];

export const TASK_CAUSE_OPTIONS = [
    { value: 'Inadequate procedures', label: 'Procédures inadaptées' },
    { value: 'Unsuitable tools or equipment', label: 'Outils ou équipements inadaptés' },
    { value: 'Difficult working conditions', label: 'Conditions de travail difficiles' },
];

export const WORKING_CAUSE_OPTIONS = [
    { value: 'Ineffective supervision', label: 'Supervision inefficace' },
    { value: 'Failed communication', label: 'Défaut de communication' },
    { value: 'Dangerous or uncontrolled environment', label: 'Environnement dangereux ou non maîtrisé' },
];

export const ORGANIZATION_CAUSE_OPTIONS = [
    { value: 'Insufficient security policy', label: 'Politique de sécurité insuffisante' },
    { value: 'Lack of training across the organization', label: "Manque de formation dans l'organisation" },
    { value: 'Poor safety culture', label: 'Culture sécurité défaillante' },
    { value: 'Defects in the design of systems/processes', label: 'Défauts de conception des systèmes/processus' },
];

/** Libellé FR d'une cause ICAM stockée en anglais, avec repli sur la valeur brute. */
export const CAUSE_LABELS: Record<string, string> = Object.fromEntries(
    [...HUMAN_CAUSE_OPTIONS, ...TASK_CAUSE_OPTIONS, ...WORKING_CAUSE_OPTIONS, ...ORGANIZATION_CAUSE_OPTIONS]
        .map((o) => [o.value, o.label]),
);

export const causeLabel = (value: string): string => CAUSE_LABELS[value] ?? value;

// ─── Catégories de leçons apprises ─────────────────────────────────────────

export const LESSON_CATEGORY_LABELS: Record<string, string> = {
    Technical: 'Technique',
    Procedural: 'Procédurale',
    Training: 'Formation',
    Communication: 'Communication',
    Other: 'Autre',
};

export const lessonCategoryLabel = (code?: string | null): string =>
    code ? LESSON_CATEGORY_LABELS[code] ?? code : '—';

export const LESSON_STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    APPROVED: 'Approuvée',
};

export const LESSON_STATUS_OPTIONS = [
    { label: 'En attente', value: 'PENDING' },
    { label: 'Approuvée', value: 'APPROVED' },
];

export const lessonStatusLabel = (code?: string | null): string =>
    code ? LESSON_STATUS_LABELS[String(code).toUpperCase()] ?? code : '—';

// ─── Tableaux PrimeReact ───────────────────────────────────────────────────

/** Gabarit FR du rapport de pagination PrimeReact. */
export const PAGINATOR_FR = '{first}–{last} sur {totalRecords}';

// ─── Dates ─────────────────────────────────────────────────────────────────

/**
 * Sérialise une Date en 'yyyy-MM-dd' en fuseau LOCAL (jamais UTC) : évite le
 * recul d'un jour quand toISOString() convertit minuit local en UTC pour un
 * LocalDate backend.
 */
export const toIsoDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
