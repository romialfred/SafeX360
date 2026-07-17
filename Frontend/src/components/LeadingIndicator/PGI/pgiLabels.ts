/**
 * Libellés et conventions du module Inspections HSE planifiées (PGI).
 *
 * Le backend conserve des codes historiques en anglais (statuts d'inspection,
 * types de risques, EPI, statuts de checklist). Toute la traduction et la
 * palette de statuts (charte R7 : violet=en attente, amber=en cours,
 * emerald=terminé/conforme, rose=annulé/non conforme, slate=non applicable)
 * sont centralisées ici.
 */

// ─── Statuts d'inspection (PENDING / IN_PROGRESS / COMPLETED / CANCELLED) ──

export const INSPECTION_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Terminée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const inspectionStatusConfig = (status?: string | null) =>
    INSPECTION_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/** Options FR pour <Select> de statut (valeurs backend conservées). */
export const INSPECTION_STATUS_OPTIONS = Object.entries(INSPECTION_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Types de risques évalués (codes backend, y compris la coquille
//     historique « erogonomic » qu'il faut conserver telle quelle) ──────────

export const RISK_TYPE_LABELS: Record<string, string> = {
    mechanical: 'Mécanique',
    chemical: 'Chimique',
    electrical: 'Électrique',
    environmental: 'Environnemental',
    erogonomic: 'Ergonomique',
};

export const riskTypeLabel = (code?: string | null): string =>
    code ? RISK_TYPE_LABELS[code] ?? code : '—';

// ─── EPI requis sur zone (codes backend helmet / goggles / …) ──────────────

export const PPE_ITEM_LABELS: Record<string, string> = {
    helmet: 'Casque de sécurité',
    goggles: 'Lunettes de protection',
    gloves: 'Gants de protection',
    boots: 'Chaussures de sécurité',
    vest: 'Gilet haute visibilité',
    mask: 'Masque respiratoire',
    harness: 'Harnais antichute',
};

export const PPE_ITEM_OPTIONS = Object.entries(PPE_ITEM_LABELS).map(([id, name]) => ({ id, name }));

export const ppeItemLabel = (code?: string | null): string =>
    code ? PPE_ITEM_LABELS[String(code).trim()] ?? code : '—';

// ─── Rôles de l'équipe d'inspection ────────────────────────────────────────

export const TEAM_ROLES = [
    'Inspecteur principal',
    'Inspecteur',
    'Responsable de zone',
    'Responsable HSE',
    'Auditeur externe',
];

// ─── Statuts de point de checklist (valeurs backend en anglais) ────────────

export const CHECKLIST_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    Compliant: { label: 'Conforme', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Non-Compliant': { label: 'Non conforme', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    'Not-Applicable': { label: 'Non applicable', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const checklistStatusConfig = (status?: string | null) =>
    CHECKLIST_STATUS_CONFIG[status ?? ''] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

export const CHECKLIST_STATUS_OPTIONS = Object.entries(CHECKLIST_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Niveaux de non-conformité ─────────────────────────────────────────────

export const NC_LEVEL_CONFIG: Record<string, { label: string; chip: string }> = {
    Critical: { label: 'Critique', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    Major: { label: 'Majeure', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    Minor: { label: 'Mineure', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const ncLevelConfig = (level?: string | null) =>
    NC_LEVEL_CONFIG[level ?? ''] ?? {
        label: level ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

export const NC_LEVEL_OPTIONS = Object.entries(NC_LEVEL_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Formatage ─────────────────────────────────────────────────────────────

export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Classes communes des chips de statut (charte : bordé, uppercase, compact). */
export const CHIP_BASE = 'inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider';

/** Style inline des titres de section (Source Serif 4, charte typographique). */
export const SECTION_TITLE_STYLE = {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: '14px',
    fontWeight: 600,
} as const;
