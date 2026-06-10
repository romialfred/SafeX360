/**
 * Libellés et conventions du module Planification Annuelle.
 *
 * Le backend conserve des codes historiques en anglais (statuts de plan
 * d'audit, catégories interne/externe, types de thèmes mensuels). Toute la
 * traduction et la palette de statuts (charte R7) sont centralisées ici :
 * un seul endroit à maintenir pour l'ensemble des pages du module.
 */

// ─── Statuts d'un plan d'audit (planningStatus backend) — charte R7 ────────

export const PLAN_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    APPROVED: { label: 'Approuvé', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejeté', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    PLANNED: { label: 'Planifié', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    'IN PROGRESS': { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Terminé', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Annulé', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const planStatusConfig = (status?: string | null) =>
    PLAN_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/** Options pour <Select> de filtre statut (codes backend, libellés FR). */
export const PLAN_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvés' },
    { value: 'REJECTED', label: 'Rejetés' },
];

// ─── Catégories d'audit (Internal / External) ──────────────────────────────

export const AUDIT_CATEGORY_CONFIG: Record<string, { label: string; chip: string }> = {
    INTERNAL: { label: 'Interne', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
    EXTERNAL: { label: 'Externe', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export const auditCategoryConfig = (category?: string | null) =>
    AUDIT_CATEGORY_CONFIG[(category ?? '').toUpperCase()] ?? {
        label: category ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Thèmes mensuels (types backend en codes FR historiques) ───────────────

export const THEME_TYPE_CONFIG: Record<string, { label: string; chip: string; dot: string }> = {
    securite: { label: 'Sécurité', chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    environnement: { label: 'Environnement', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    'sante-securite': { label: 'Santé & sécurité', chip: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    sensibilisation: { label: 'Sensibilisation', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    'programme-national': { label: 'Programme national', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

export const themeTypeConfig = (type?: string | null) =>
    THEME_TYPE_CONFIG[type ?? ''] ?? {
        label: type ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
    };

export const THEME_TYPE_OPTIONS = Object.entries(THEME_TYPE_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

export const THEME_CATEGORY_LABELS: Record<string, string> = {
    RSS: 'RSS — Réunion sécurité',
    TDM: 'TDM — Tournée Leadership',
};

export const THEME_CATEGORY_OPTIONS = Object.entries(THEME_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const themeCategoryLabel = (code?: string | null) =>
    code ? THEME_CATEGORY_LABELS[code] ?? code : '—';

// ─── Mois ──────────────────────────────────────────────────────────────────

export const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const MONTHS_FR_SHORT = [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
];

// ─── Formatage ─────────────────────────────────────────────────────────────

/**
 * Sérialise une Date en 'yyyy-MM-dd' en fuseau LOCAL (jamais UTC) : évite le
 * recul d'un jour quand axios convertit minuit local en ISO UTC pour un
 * LocalDate backend.
 */
export const toIsoDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
