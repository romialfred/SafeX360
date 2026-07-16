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

// ─── Dates ─────────────────────────────────────────────────────────────────

/**
 * `Date` -> 'YYYY-MM-DD' dans le fuseau LOCAL (convention plateforme).
 * `toISOString()` convertit en UTC et décale la date d'un jour pour les
 * saisies faites en soirée / à l'ouest de Greenwich : le backend attend un
 * LocalDate, jamais un instant.
 */
export const toIsoDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/** Repli null-safe pour les champs de date optionnels d'un formulaire. */
export const toIsoDateLocalOrNull = (value: unknown): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : toIsoDateLocal(date);
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

// ════════════════════════════════════════════════════════════════════════════
// LOT 52 — Mise en conformité ISO 19011 : programme d'audit, checklist par
// référentiel, classification des constats et vérification d'efficacité.
// ════════════════════════════════════════════════════════════════════════════

// ─── Statuts du programme d'audit annuel (AuditProgramStatus backend) ───────
// violet = proposé (en attente direction) · green = approuvé · slate = clôturé

export const PROGRAM_STATUS_LABELS: Record<string, string> = {
    PROPOSED: 'Proposé',
    APPROVED: 'Approuvé',
    CLOSED: 'Clôturé',
};

export const PROGRAM_STATUS_COLORS: Record<string, string> = {
    PROPOSED: 'violet',
    APPROVED: 'green',
    CLOSED: 'gray',
};

export const programStatusLabel = (status?: string | null): string =>
    PROGRAM_STATUS_LABELS[String(status ?? '').toUpperCase()] ?? String(status ?? '—');

export const programStatusColor = (status?: string | null): string =>
    PROGRAM_STATUS_COLORS[String(status ?? '').toUpperCase()] ?? 'gray';

// ─── Classification ISO 19011 des constats (Observation.classification) ─────
// red = NC majeure · orange = NC mineure · blue = observation · teal = OFI

export const OBS_CLASSIFICATION_LABELS: Record<string, string> = {
    NC_MAJEURE: 'Non-conformité majeure',
    NC_MINEURE: 'Non-conformité mineure',
    OBSERVATION: 'Observation',
    OPPORTUNITE: "Opportunité d'amélioration",
};

export const OBS_CLASSIFICATION_COLORS: Record<string, string> = {
    NC_MAJEURE: 'red',
    NC_MINEURE: 'orange',
    OBSERVATION: 'blue',
    OPPORTUNITE: 'teal',
};

export const OBS_CLASSIFICATION_OPTIONS = [
    { value: 'NC_MAJEURE', label: 'Non-conformité majeure' },
    { value: 'NC_MINEURE', label: 'Non-conformité mineure' },
    { value: 'OBSERVATION', label: 'Observation' },
    { value: 'OPPORTUNITE', label: "Opportunité d'amélioration" },
];

export const obsClassificationLabel = (classification?: string | null): string =>
    OBS_CLASSIFICATION_LABELS[String(classification ?? '').toUpperCase()] ?? String(classification ?? '—');

export const obsClassificationColor = (classification?: string | null): string =>
    OBS_CLASSIFICATION_COLORS[String(classification ?? '').toUpperCase()] ?? 'gray';

/** Une classification NC_* exige clause + preuve, et autorise l'escalade. */
export const isNcClassification = (classification?: string | null): boolean =>
    String(classification ?? '').toUpperCase().startsWith('NC_');

// ─── Résultats de checklist (AuditChecklistItem.result) ─────────────────────
// green = conforme · red = non conforme · slate = N.A. · amber = à évaluer

export const CHECKLIST_RESULT_LABELS: Record<string, string> = {
    CONFORME: 'Conforme',
    NON_CONFORME: 'Non conforme',
    NON_APPLICABLE: 'N.A.',
    A_EVALUER: 'À évaluer',
};

export const CHECKLIST_RESULT_COLORS: Record<string, string> = {
    CONFORME: 'green',
    NON_CONFORME: 'red',
    NON_APPLICABLE: 'gray',
    A_EVALUER: 'yellow',
};

/** Pills Tailwind des boutons segmentés de résultat (état actif). */
export const CHECKLIST_RESULT_ACTIVE_CHIPS: Record<string, string> = {
    CONFORME: 'bg-emerald-600 text-white border-emerald-600',
    NON_CONFORME: 'bg-rose-600 text-white border-rose-600',
    NON_APPLICABLE: 'bg-slate-600 text-white border-slate-600',
    A_EVALUER: 'bg-amber-500 text-white border-amber-500',
};

export const checklistResultLabel = (result?: string | null): string =>
    CHECKLIST_RESULT_LABELS[String(result ?? '').toUpperCase()] ?? String(result ?? '—');

// ─── Référentiels de checklist (valeurs backend ISO_45001...) ───────────────
// Affichage : TOUJOURS via IsoBadge (règle plateforme — jamais de texte ISO nu).

// LOT 53 — MINIER : référentiel sectoriel (exigences propres à l'exploitation
// minière, chaque question rattachée à sa clause ISO 45001/14001 fondatrice).
export const CHECKLIST_REFERENTIALS = ['ISO_45001', 'ISO_14001', 'ISO_9001', 'MINIER'] as const;

/** 'ISO_45001' (backend) → 'ISO 45001' (norme pour IsoBadge). */
export const referentialToNorm = (referential?: string | null): string =>
    String(referential ?? '').replace('_', ' ').trim();

/** Vrai pour les référentiels ISO (badge IsoBadge) — MINIER a son propre badge. */
export const isIsoReferential = (referential?: string | null): boolean =>
    String(referential ?? '').startsWith('ISO_');

// ─── Verdicts de vérification d'efficacité (ISO 19011 §6.6) ─────────────────
// green = efficace · amber = partiellement efficace · red = inefficace

export const EFFECTIVENESS_VERDICT_LABELS: Record<string, string> = {
    EFFICACE: 'Efficace',
    PARTIELLEMENT_EFFICACE: 'Partiellement efficace',
    INEFFICACE: 'Inefficace',
};

export const EFFECTIVENESS_VERDICT_COLORS: Record<string, string> = {
    EFFICACE: 'green',
    PARTIELLEMENT_EFFICACE: 'yellow',
    INEFFICACE: 'red',
};

export const EFFECTIVENESS_VERDICT_OPTIONS = [
    { value: 'EFFICACE', label: 'Efficace' },
    { value: 'PARTIELLEMENT_EFFICACE', label: 'Partiellement efficace' },
    { value: 'INEFFICACE', label: 'Inefficace' },
];

export const effectivenessVerdictLabel = (verdict?: string | null): string =>
    EFFECTIVENESS_VERDICT_LABELS[String(verdict ?? '').toUpperCase()] ?? String(verdict ?? '—');

export const effectivenessVerdictColor = (verdict?: string | null): string =>
    EFFECTIVENESS_VERDICT_COLORS[String(verdict ?? '').toUpperCase()] ?? 'gray';

// ─── Priorisation par les risques (RiskSuggestionDTO) ───────────────────────

export const SUGGESTED_FREQUENCY_LABELS: Record<string, string> = {
    TRIMESTRIEL: 'Trimestriel',
    SEMESTRIEL: 'Semestriel',
    ANNUEL: 'Annuel',
};

export const SUGGESTED_FREQUENCY_COLORS: Record<string, string> = {
    TRIMESTRIEL: 'red',
    SEMESTRIEL: 'orange',
    ANNUEL: 'green',
};

/** Chip Tailwind du score de risque : rouge > 30, ambre > 15, sinon émeraude. */
export const riskScoreChip = (score: number): string =>
    score > 30
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : score > 15
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

// ─── Erreurs métier ISO 19011 (codes HSException backend) ───────────────────
// Le backend ne traduit pas encore ces codes (clés absentes d'application.yml,
// errorMessage arrive null) : la traduction FR est donc assurée côté frontend.

export const AUDIT_ISO_ERROR_MESSAGES: Record<string, string> = {
    COMMENT_REQUIRED_FOR_NON_CONFORME: 'Un commentaire factuel est obligatoire pour une réponse « Non conforme ».',
    CHECKLIST_RESULT_INVALID: 'Résultat de checklist invalide.',
    CHECKLIST_ITEM_NOT_FOUND: 'Question de checklist introuvable.',
    CHECKLIST_REFERENTIAL_INVALID: 'Référentiel de checklist invalide.',
    CLASSIFICATION_INVALID: 'Classification ISO invalide.',
    CLAUSE_REQUIRED_FOR_NC: 'La clause du référentiel est obligatoire pour une non-conformité.',
    EVIDENCE_REQUIRED_FOR_NC: 'Au moins une preuve est obligatoire pour une non-conformité.',
    ONLY_NC_CAN_BE_ESCALATED: 'Seul un constat classé non-conformité (majeure ou mineure) peut être escaladé.',
    OBSERVATION_NOT_FOUND: 'Constat introuvable.',
    EFFECTIVENESS_REQUIRES_COMPLETED_RECOMMENDATION: "La vérification d'efficacité exige une recommandation terminée.",
    EFFECTIVENESS_CHECK_NOT_FOUND: "Vérification d'efficacité introuvable.",
    EFFECTIVENESS_ALREADY_CONCLUDED: 'Cette vérification a déjà reçu un verdict.',
    VERDICT_INVALID: "Verdict d'efficacité invalide.",
    DUE_DATE_REQUIRED: "La date d'échéance est obligatoire.",
    AUDIT_PROGRAM_NOT_FOUND: "Programme d'audit introuvable.",
    RECOMMENDATION_NOT_FOUND: 'Recommandation introuvable.',
    AUDIT_NOT_FOUND: 'Audit introuvable.',
};

/**
 * Extrait un message d'erreur FR d'une erreur axios des endpoints ISO 19011 :
 * code métier connu → traduction FR ; message backend présent → tel quel ;
 * sinon repli fourni par l'appelant.
 */
export const auditIsoErrorMessage = (err: any, fallback: string): string => {
    const raw = err?.response?.data?.errorMessage;
    if (raw && AUDIT_ISO_ERROR_MESSAGES[raw]) return AUDIT_ISO_ERROR_MESSAGES[raw];
    if (typeof raw === 'string' && raw.trim().length > 0) return raw;
    return fallback;
};
