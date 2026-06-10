/**
 * Libellés et conventions du module Gestion des Audits.
 *
 * Le backend conserve des valeurs historiques en anglais (rôles d'auditeur,
 * méthodes, références documentaires, statuts de rapport...). Comme pour le
 * module Conformité Réglementaire (complianceLabels.ts), toute la traduction
 * FR et la palette de statuts (charte R7) sont centralisées ici : les VALEURS
 * envoyées au backend restent inchangées, seuls les libellés affichés sont
 * traduits.
 */

// ─── Statuts d'audit (AuditStatus backend) — palette charte R7 ─────────────
// cyan = planifié · violet = en attente/préparation · amber = en cours ·
// emerald/green = clôturé · gray/slate = annulé

export const AUDIT_STATUS_COLORS: Record<string, string> = {
    PLANNING: 'cyan',
    PREPARATION: 'violet',
    EXECUTION: 'amber',
    CLOSED: 'green',
    CANCELLED: 'gray',
};

export const auditStatusColor = (status?: string | null): string =>
    AUDIT_STATUS_COLORS[String(status ?? '').toUpperCase()] ?? 'gray';

/** Couleurs hex pour les graphiques (donut de répartition). */
export const AUDIT_STATUS_HEX: Record<string, string> = {
    PLANNING: '#0891B2',     // cyan
    PREPARATION: '#7C3AED',  // violet
    EXECUTION: '#D97706',    // amber
    CLOSED: '#059669',       // emerald
    CANCELLED: '#64748B',    // slate
};

// ─── Catégorie d'audit (INTERNAL / EXTERNAL) ───────────────────────────────

export const AUDIT_CATEGORY_LABELS: Record<string, string> = {
    INTERNAL: 'Interne',
    EXTERNAL: 'Externe',
    Internal: 'Interne',
    External: 'Externe',
};

export const auditCategoryLabel = (category?: string | null): string =>
    AUDIT_CATEGORY_LABELS[String(category ?? '')] ??
    AUDIT_CATEGORY_LABELS[String(category ?? '').toUpperCase()] ??
    String(category ?? '—');

// ─── Statuts de recommandation — palette charte R7 ─────────────────────────
// violet = en attente · amber = en cours · emerald = terminée ·
// rose/red = en retard · slate = annulée

export const REC_STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    DELAYED: 'En retard',
    CANCELLED: 'Annulée',
};

export const REC_STATUS_COLORS: Record<string, string> = {
    PENDING: 'violet',
    IN_PROGRESS: 'amber',
    COMPLETED: 'green',
    DELAYED: 'red',
    CANCELLED: 'gray',
};

/** Chips Tailwind (mêmes conventions que complianceLabels). */
export const REC_STATUS_CHIPS: Record<string, string> = {
    PENDING: 'bg-violet-50 text-violet-700 border-violet-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DELAYED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const recStatusLabel = (status?: string | null): string =>
    REC_STATUS_LABELS[String(status ?? '').toUpperCase()] ?? String(status ?? '—');

export const recStatusColor = (status?: string | null): string =>
    REC_STATUS_COLORS[String(status ?? '').toUpperCase()] ?? 'gray';

/** Options FR pour les Select de suivi (valeurs backend conservées). */
export const REC_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminée' },
];

/** Options FR pour le statut initial d'une action / recommandation. */
export const ACTION_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'CANCELLED', label: 'Annulée' },
    { value: 'COMPLETED', label: 'Terminée' },
];

// ─── Priorités de recommandation (backend : High / Average / Weak) ─────────

export const REC_PRIORITY_LABELS: Record<string, string> = {
    High: 'Élevée',
    Average: 'Moyenne',
    Weak: 'Faible',
    HIGH: 'Élevée',
    AVERAGE: 'Moyenne',
    WEAK: 'Faible',
    MEDIUM: 'Moyenne',
    LOW: 'Faible',
};

export const recPriorityLabel = (priority?: string | null): string =>
    REC_PRIORITY_LABELS[String(priority ?? '')] ??
    REC_PRIORITY_LABELS[String(priority ?? '').toUpperCase()] ??
    String(priority ?? '—');

export const REC_PRIORITY_OPTIONS = [
    { value: 'High', label: 'Élevée' },
    { value: 'Average', label: 'Moyenne' },
    { value: 'Weak', label: 'Faible' },
];

export const REC_PRIORITY_COLORS: Record<string, string> = {
    High: 'red',
    Average: 'orange',
    Weak: 'yellow',
};

// ─── Rôles d'auditeur (valeurs backend conservées : Lead Auditor...) ───────

export const AUDITOR_ROLE_OPTIONS = [
    { value: 'Lead Auditor', label: 'Auditeur principal' },
    { value: 'Auditor', label: 'Auditeur' },
    { value: 'Technical Expert', label: 'Expert technique' },
    { value: 'Observer', label: 'Observateur' },
    { value: 'Audit Reporter', label: "Rapporteur d'audit" },
];

// ─── Méthodes d'audit planifiées (valeurs historiques EN conservées) ───────

export const AUDIT_METHOD_OPTIONS = [
    { value: 'Individual interviews', label: 'Entretiens individuels' },
    { value: 'Group interviews', label: 'Entretiens collectifs' },
    { value: 'Field observations', label: 'Observations terrain' },
    { value: 'Document verification', label: 'Vérification documentaire' },
    { value: 'Equipment Inspection', label: 'Inspection des équipements' },
    { value: 'Tests and measurements', label: 'Essais et mesures' },
    { value: 'Sample analysis', label: "Analyse d'échantillons" },
    { value: 'Emergency simulation', label: "Simulation d'urgence" },
];

// ─── Références documentaires internes (valeurs historiques EN) ────────────

export const AUDIT_REFERENCE_OPTIONS = [
    { value: 'Integrated Management Manual', label: 'Manuel de management intégré' },
    { value: 'HSE Policy', label: 'Politique HSE' },
    { value: 'Operational procedures', label: 'Procédures opérationnelles' },
    { value: 'Work Instructions', label: 'Instructions de travail' },
    { value: 'Prevention plans', label: 'Plans de prévention' },
    { value: 'Risk analyses', label: 'Analyses de risques' },
    { value: 'Compliance Records', label: 'Enregistrements de conformité' },
    { value: 'HSE Dashboards', label: 'Tableaux de bord HSE' },
];

// ─── Objectifs d'audit (valeurs historiques EN) ────────────────────────────

export const AUDIT_OBJECTIVE_OPTIONS = [
    { value: 'Verify regulatory compliance', label: 'Vérifier la conformité réglementaire' },
    { value: 'Evaluate the effectiveness of the management system', label: "Évaluer l'efficacité du système de management" },
    { value: 'Identify areas for improvement', label: "Identifier les axes d'amélioration" },
];

// ─── Statut du validateur de rapport (valeurs historiques EN) ──────────────

export const VALIDATOR_STATUS_OPTIONS = [
    { value: 'Pending Review', label: 'En attente de revue' },
    { value: 'Approved', label: 'Approuvé' },
    { value: 'Rejected', label: 'Rejeté' },
];

export const VALIDATOR_STATUS_LABELS: Record<string, string> = {
    'Pending Review': 'En attente de revue',
    Approved: 'Approuvé',
    Rejected: 'Rejeté',
};

// ─── Types d'observation (valeurs historiques EN) ──────────────────────────

export const OBSERVATION_TYPE_OPTIONS = [
    { value: 'Observation', label: 'Observation' },
    { value: 'Compliance', label: 'Conformité' },
    { value: 'Non-compliance', label: 'Non-conformité' },
    { value: 'Opportunity for improvement', label: "Opportunité d'amélioration" },
];

export const OBSERVATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    OBSERVATION_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

// ─── Gravités d'observation (valeurs '1'..'5') ─────────────────────────────

export const OBS_SEVERITY_OPTIONS = [
    { value: '1', label: '1 — Négligeable' },
    { value: '2', label: '2 — Mineure' },
    { value: '3', label: '3 — Modérée' },
    { value: '4', label: '4 — Majeure' },
    { value: '5', label: '5 — Catastrophique' },
];

export const OBS_SEVERITY_LABELS: Record<string, string> = {
    '1': 'Négligeable',
    '2': 'Mineure',
    '3': 'Modérée',
    '4': 'Majeure',
    '5': 'Catastrophique',
};

// ─── Types de recommandation (valeurs historiques EN) ──────────────────────

export const REC_TYPE_OPTIONS = [
    { value: 'Security', label: 'Sécurité' },
    { value: 'Internal Compliance', label: 'Conformité interne' },
    { value: 'Regulatory', label: 'Réglementaire' },
    { value: 'Processes Improvement', label: 'Amélioration des processus' },
    { value: 'Other', label: 'Autre' },
];

// ─── Traduction d'affichage des valeurs historiques EN stockées ────────────

const TERM_LABELS: Record<string, string> = Object.fromEntries(
    [
        ...AUDIT_METHOD_OPTIONS,
        ...AUDIT_REFERENCE_OPTIONS,
        ...AUDIT_OBJECTIVE_OPTIONS,
        ...AUDITOR_ROLE_OPTIONS,
        ...REC_TYPE_OPTIONS,
        ...OBSERVATION_TYPE_OPTIONS,
    ].map((o) => [o.value, o.label])
);

/**
 * Traduit en FR une valeur historique anglaise stockée en base
 * (méthode, référence documentaire, objectif, rôle...). Repli sur la
 * valeur brute si inconnue : les nouvelles données FR passent telles quelles.
 */
export const translateAuditTerm = (value?: string | null): string => {
    const v = String(value ?? '').trim();
    if (!v) return '—';
    return TERM_LABELS[v] ?? v;
};
