/**
 * Libellés et conventions du module Actions Correctives (CAPA).
 *
 * Le backend conserve des codes historiques en anglais (PENDING,
 * INCIDENT…). Toute la traduction française et la palette de statuts
 * (charte R7) sont centralisées ici pour les pages du module.
 */

// ─── Statuts d'une action corrective ───────────────────────────────────────
// Charte R7 : violet = en attente, amber = en cours, emerald = réalisé,
// rose = annulé. Depuis la mise en conformité ISO 45001 §10.2 (revue
// d'efficacité), le cycle de vie ne s'arrête plus à « Réalisée » :
//   • teal   = Vérifiée efficace (efficacité prouvée par un vérificateur)
//   • orange = Rouverte (revue jugée inefficace → l'action repart)
// Ces deux statuts ne se posent QUE via la revue d'efficacité (page Détail),
// jamais via le Select de progression — d'où leur exclusion de CA_STATUS_OPTIONS.

export const CA_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    COMPLETED: { label: 'Réalisée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    VERIFIED: { label: 'Vérifiée efficace', chip: 'bg-teal-50 text-teal-700 border-teal-200' },
    REOPENED: { label: 'Rouverte', chip: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export const caStatusConfig = (status?: string | null) =>
    CA_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/**
 * Statuts atteignables par la voie « avancement » (progression / ActionProcess).
 * Ordre significatif : il représente la progression du cycle de vie et sert à
 * restreindre le Select de mise à jour aux statuts en aval du statut courant.
 * VERIFIED / REOPENED en sont volontairement exclus (voir CA_STATUS_CONFIG).
 */
export const CA_PROGRESS_STATUSES = ['PENDING', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED'] as const;

/**
 * Options prêtes pour <Select>, même ordre que le référentiel historique
 * actionStatuses (PENDING → IN_PROGRESS → CANCELLED → COMPLETED).
 */
export const CA_STATUS_OPTIONS = CA_PROGRESS_STATUSES.map((value) => ({
    value,
    label: CA_STATUS_CONFIG[value].label,
}));

// ─── Revue d'efficacité (ISO 45001 §10.2 e) ─────────────────────────────────

export const EFFECTIVENESS_VERDICT_CONFIG: Record<string, { label: string; chip: string }> = {
    EFFECTIVE: { label: 'Efficace', chip: 'bg-teal-50 text-teal-700 border-teal-200' },
    PARTIALLY_EFFECTIVE: { label: 'Partiellement efficace', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    INEFFECTIVE: { label: 'Inefficace', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const effectivenessVerdictConfig = (verdict?: string | null) =>
    EFFECTIVENESS_VERDICT_CONFIG[(verdict ?? '').toUpperCase()] ?? {
        label: verdict ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

export const EFFECTIVENESS_VERDICT_OPTIONS = Object.entries(EFFECTIVENESS_VERDICT_CONFIG).map(
    ([value, cfg]) => ({ value, label: cfg.label }),
);

// ─── Sources d'une action corrective ───────────────────────────────────────

export const CA_TYPE_LABELS: Record<string, string> = {
    INCIDENT: 'Incident',
    GENERAL_INSPECTION: 'Inspection générale',
    HS_ACTIVITY: 'Activité HSE',
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Quasi-accident',
    HAZARD: 'Danger',
    ADHOC: "Idée d'amélioration",
};

export const caTypeLabel = (code?: string | null) =>
    code ? CA_TYPE_LABELS[code] ?? code : '—';

// ─── Classification de l'action (ISO 45001 §8.1.2 / §10.2) ──────────────────

// Hiérarchie des mesures de maîtrise, de la plus efficace à la moins efficace.
// L'ordre = rang de maturité ; les 2 derniers niveaux (EPI/administratif) sont
// « faibles » et déclenchent une incitation à remonter la hiérarchie.
export const CONTROL_HIERARCHY_CONFIG: Record<string, { label: string; short: string; rank: number; chip: string; weak?: boolean }> = {
    ELIMINATION: { label: 'Élimination', short: 'Éliminer le danger', rank: 1, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SUBSTITUTION: { label: 'Substitution', short: 'Remplacer le danger', rank: 2, chip: 'bg-teal-50 text-teal-700 border-teal-200' },
    ENGINEERING: { label: 'Ingénierie', short: 'Isoler du danger', rank: 3, chip: 'bg-sky-50 text-sky-700 border-sky-200' },
    ADMINISTRATIVE: { label: 'Administratif', short: 'Consignes / procédures', rank: 4, chip: 'bg-amber-50 text-amber-700 border-amber-200', weak: true },
    PPE: { label: 'EPI', short: 'Protéger l\'individu', rank: 5, chip: 'bg-orange-50 text-orange-700 border-orange-200', weak: true },
};
export const CONTROL_HIERARCHY_ORDER = ['ELIMINATION', 'SUBSTITUTION', 'ENGINEERING', 'ADMINISTRATIVE', 'PPE'] as const;
export const CONTROL_HIERARCHY_OPTIONS = CONTROL_HIERARCHY_ORDER.map((value) => ({
    value,
    label: `${CONTROL_HIERARCHY_CONFIG[value].label} — ${CONTROL_HIERARCHY_CONFIG[value].short}`,
}));
export const controlHierarchyConfig = (v?: string | null) =>
    (v && CONTROL_HIERARCHY_CONFIG[v]) || { label: v || '—', short: '', rank: 99, chip: 'bg-slate-100 text-slate-600 border-slate-200' };
/** Vrai si la mesure est « faible » (EPI/administratif seul) → nudge. */
export const isWeakControl = (v?: string | null) => Boolean(v && CONTROL_HIERARCHY_CONFIG[v]?.weak);

export const ACTION_TYPE_CONFIG: Record<string, string> = {
    IMMEDIATE: 'Immédiate',
    CORRECTIVE: 'Corrective',
    PREVENTIVE: 'Préventive',
};
export const ACTION_TYPE_OPTIONS = Object.entries(ACTION_TYPE_CONFIG).map(([value, label]) => ({ value, label }));

export const ACTION_PRIORITY_CONFIG: Record<string, { label: string; chip: string }> = {
    P1: { label: 'P1 — Élevée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    P2: { label: 'P2 — Moyenne', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    P3: { label: 'P3 — Faible', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};
export const ACTION_PRIORITY_OPTIONS = Object.entries(ACTION_PRIORITY_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

// ─── Formatage ─────────────────────────────────────────────────────────────

/** Date courte FR : « 24 juil. 2026 ». */
export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Vrai si l'échéance est dépassée (comparaison à minuit local). */
export const isOverdue = (deadline?: string | null): boolean => {
    if (!deadline) return false;
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d < today;
};

/** Typographie serif des titres de section (charte R7). */
export const SERIF = "'Source Serif 4', Georgia, serif";
