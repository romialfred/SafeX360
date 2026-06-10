/**
 * Libellés et conventions du module Tournées Leadership (ManagementTour).
 *
 * Le backend conserve des codes historiques en anglais (PENDING, ST,
 * helmet…). Toute la traduction française et la palette de statuts
 * (charte R7) sont centralisées ici pour les pages du module.
 */

// ─── Statuts d'une tournée (codes backend hs-activity) ─────────────────────
// Charte R7 : cyan = planifié, amber = en cours, emerald = réalisé,
// rose = annulé.

export const TOUR_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'Planifiée', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Réalisée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const tourStatusConfig = (status?: string | null) =>
    TOUR_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/** Options prêtes pour <Select> : valeur = code backend, libellé = FR. */
export const TOUR_STATUS_OPTIONS = Object.entries(TOUR_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Types d'activité HSE ──────────────────────────────────────────────────

export const TOUR_TYPE_LABELS: Record<string, string> = {
    HSM: 'Réunion santé-sécurité',
    ST: 'Tournée leadership',
};

export const TOUR_TYPE_OPTIONS = Object.entries(TOUR_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const tourTypeLabel = (code?: string | null) =>
    code ? TOUR_TYPE_LABELS[code] ?? code : '—';

// ─── EPI — codes backend conservés (helmet, goggles…) ──────────────────────

export const TOUR_PPE_LABELS: Record<string, string> = {
    helmet: 'Casque de sécurité',
    goggles: 'Lunettes de protection',
    gloves: 'Gants de protection',
    boots: 'Chaussures de sécurité',
    vest: 'Gilet haute visibilité',
    mask: 'Masque respiratoire',
    harness: 'Harnais antichute',
};

export const TOUR_PPE_OPTIONS = Object.entries(TOUR_PPE_LABELS).map(([id, label]) => ({ id, label }));

// ─── Rôles des participants à la tournée ───────────────────────────────────

export const TOUR_ROLES = [
    'Sponsor (Direction)',
    'Manager',
    'Superviseur',
    'Responsable HSE',
    'Responsable de zone',
    'Observateur',
];

// ─── Formatage ─────────────────────────────────────────────────────────────

/** Date courte FR : « 24 juil. 2026 ». */
export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Heure FR : « 14h30 » à partir d'un « 14:30[:00] » backend. */
export const formatTimeFr = (time?: string | null): string => {
    if (!time) return '—';
    return time.slice(0, 5).replace(':', 'h');
};

/** Typographie serif des titres de section (charte R7). */
export const SERIF = "'Source Serif 4', Georgia, serif";
