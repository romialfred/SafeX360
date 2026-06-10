/**
 * Libellés et conventions du module Gestion Documentaire.
 *
 * Le backend conserve des codes en anglais (catégories, statuts, niveaux
 * d'accès). Toute la traduction et la palette de statuts (charte R7) sont
 * centralisées ici : un seul endroit à maintenir pour l'ensemble des pages
 * du module.
 */

// ─── Catégories ──────────────────────────────────────────────────────────────

export const DOC_CATEGORY_LABELS: Record<string, string> = {
    Policy: 'Politique',
    Report: 'Rapport',
    Communication: 'Communication',
    Regulatory: 'Réglementaire',
    Procedure: 'Procédure',
    Form: 'Formulaire',
    Training: 'Formation',
    Other: 'Autre',
};

/** Couleurs Mantine par catégorie (badges). */
export const DOC_CATEGORY_COLORS: Record<string, string> = {
    Policy: 'indigo',
    Report: 'blue',
    Communication: 'pink',
    Regulatory: 'violet',
    Procedure: 'teal',
    Form: 'cyan',
    Training: 'green',
    Other: 'gray',
};

export const DOC_CATEGORY_OPTIONS = Object.entries(DOC_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const docCategoryLabel = (code?: string | null) =>
    code ? DOC_CATEGORY_LABELS[code] ?? code : '—';

// ─── Statuts du cycle de vie — palette charte R7 ─────────────────────────────

export interface ChipConfig {
    label: string;
    /** Classes Tailwind du chip bordé. */
    chip: string;
}

const CHIP_NEUTRE = 'bg-slate-50 text-slate-600 border-slate-200';

export const DOC_STATUS_CONFIG: Record<string, ChipConfig> = {
    DRAFT: { label: 'Brouillon', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    UNDER_REVIEW: { label: 'En revue', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    APPROVED: { label: 'Approuvé', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ARCHIVED: { label: 'Archivé', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const docStatusConfig = (status?: string | null): ChipConfig =>
    DOC_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ? String(status) : '—',
        chip: CHIP_NEUTRE,
    };

export const DOC_STATUS_OPTIONS = Object.entries(DOC_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Niveaux d'accès ─────────────────────────────────────────────────────────

export const ACCESS_LEVEL_CONFIG: Record<string, ChipConfig & { description: string }> = {
    PUBLIC: {
        label: 'Public',
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Consultable par tous les utilisateurs de la plateforme.',
    },
    INTERNAL: {
        label: 'Interne',
        chip: 'bg-sky-50 text-sky-700 border-sky-200',
        description: "Réservé aux employés de l'entreprise.",
    },
    CONFIDENTIAL: {
        label: 'Confidentiel',
        chip: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Accès limité aux services concernés.',
    },
    RESTRICTED: {
        label: 'Restreint',
        chip: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Réservé aux personnes nommément habilitées.',
    },
};

export const accessLevelConfig = (level?: string | null): ChipConfig =>
    ACCESS_LEVEL_CONFIG[(level ?? '').toUpperCase()] ?? {
        label: level ? String(level) : '—',
        chip: CHIP_NEUTRE,
    };

export const ACCESS_LEVEL_OPTIONS = Object.entries(ACCESS_LEVEL_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Suggestions d'étiquettes (tags) ─────────────────────────────────────────

export const TAG_SUGGESTIONS = [
    'sécurité',
    'politique',
    'procédure',
    'formation',
    'urgence',
    'maintenance',
    'équipement',
    'conformité',
    'audit',
    'rapport',
];

// ─── Formatage ───────────────────────────────────────────────────────────────

export const formatDateFr = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

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
