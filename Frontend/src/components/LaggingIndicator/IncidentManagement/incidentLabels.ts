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

/** Couleurs Mantine par statut d'incident (miroir de la carte de ViewDetails). */
export const INCIDENT_STATUS_COLORS: Record<string, string> = {
    PENDING: 'gray',
    REPORTED: 'blue',
    INVESTIGATION: 'cyan',
    INVESTIGATION_COMPLETED: 'yellow',
    CORRECTIVE_ACTIONS: 'orange',
    CLOSED: 'green',
    REJECTED: 'red',
};

export const incidentStatusColor = (code?: string | null): string =>
    INCIDENT_STATUS_COLORS[String(code ?? '').toUpperCase()] ?? 'gray';

/**
 * Options FR pour les <Select> de statut d'incident.
 *
 * ATTENTION : cette liste est le catalogue COMPLET des statuts — elle ne doit
 * jamais alimenter un <Select> telle quelle. Un statut ne se choisit pas, il
 * TRANSITE (spec §2.3) : filtrez-la par les transitions autorisées depuis
 * l'état courant, comme le fait Details/ViewDetails. Usage légitime restant :
 * les filtres de liste (IncidentManagementData), où toutes les valeurs sont
 * des critères de recherche et non des cibles de transition.
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
 * incident.
 *
 * ⚠ Les valeurs DOIVENT correspondre exactement à l'enum backend
 * {@code ActionStatus} : PENDING, IN_PROGRESS, COMPLETED, **CANCELLED** (deux L),
 * ON_HOLD. Le commentaire précédent affirmait « valeur backend CANCELED —
 * orthographe historique conservée » : c'était FAUX. L'enum n'a jamais accepté
 * qu'un seul L, donc choisir « Annulée » envoyait une valeur inconnue, Jackson
 * levait HttpMessageNotReadableException → 500 → toute la saisie perdue.
 * Vérifier contre l'enum avant d'ajouter une valeur ici.
 */
export const ACTION_STATUS_OPTIONS = [
    { label: 'En attente', value: 'PENDING' },
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Annulée', value: 'CANCELLED' },
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

/**
 * Sérialise une Date en 'yyyy-MM-ddTHH:mm:ss' en fuseau LOCAL, SANS suffixe 'Z'
 * — format attendu par un LocalDateTime backend (occurredAt, discoveryTime).
 *
 * Pourquoi : toISOString() (et le toJSON() implicite appliqué par axios à tout
 * objet Date) convertit l'horodatage en UTC. À UTC+1, un incident survenu le
 * 17/07 à 00h30 est alors stocké '2026-07-16T23:30' : l'incident CHANGE DE JOUR
 * et l'enregistrement devient une preuve fausse (ISO 45001 §9.1 — la date d'un
 * constat doit être celle de l'observation réelle).
 *
 * toIsoDateLocal ne suffit pas ici : elle perd l'heure, or l'heure de survenance
 * est une donnée d'investigation (croisement avec les rotations de poste).
 *
 * ATTENTION : le résultat doit être envoyé tel quel (string). Le repasser dans
 * un `new Date()` ou laisser un objet Date dans le payload réintroduit le bug.
 *
 * Tolère une valeur déjà sérialisée (patron de auditLabels.toIsoDateOrNull) ;
 * renvoie null si la valeur est absente ou invalide.
 */
export const toIsoDateTimeLocal = (value?: Date | string | null): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${toIsoDateLocal(date)}T${hh}:${mm}:${ss}`;
};
