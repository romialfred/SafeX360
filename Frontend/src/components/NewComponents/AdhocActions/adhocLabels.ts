/**
 * Libellés et conventions du module Suggestions d'amélioration (actions ad hoc).
 *
 * Le backend conserve des codes en anglais (statuts d'action, types de
 * source). Toute la traduction et la palette de statuts (charte R7) sont
 * centralisées ici : un seul endroit à maintenir pour l'ensemble des pages
 * du module.
 */

// ─── Statuts d'une suggestion (status backend) — charte R7 ─────────────────

export const ADHOC_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Terminée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const adhocStatusConfig = (status?: string | null) =>
    ADHOC_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/**
 * Options pour <Select> : même ordre que le cycle de vie backend
 * (PENDING → IN_PROGRESS → CANCELLED → COMPLETED), utilisé par la logique
 * de progression du formulaire de mise à jour.
 */
export const ADHOC_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'CANCELLED', label: 'Annulée' },
    { value: 'COMPLETED', label: 'Terminée' },
];

// ─── Types de source d'une action corrective ───────────────────────────────

export const SOURCE_TYPE_LABELS: Record<string, string> = {
    INCIDENT: 'Incident',
    GENERAL_INSPECTION: 'Inspection générale',
    HS_ACTIVITY: 'Activité santé-sécurité',
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Presqu’accident',
    HAZARD: 'Danger',
    ADHOC: "Suggestion d'amélioration",
};

export const sourceTypeLabel = (code?: string | null) => {
    const normalized = (code ?? '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
    return SOURCE_TYPE_LABELS[normalized] ?? (code || '—');
};

// ─── États des actions en attente (calculés côté client) ───────────────────

export const PENDING_STATE_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    URGENT: { label: 'Urgent', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    OVERDUE: { label: 'En retard', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const pendingStateConfig = (state?: string | null) =>
    PENDING_STATE_CONFIG[(state ?? '').toUpperCase()] ?? {
        label: state ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Progression ───────────────────────────────────────────────────────────

/** Couleur Mantine de la barre de progression selon l'avancement. */
export const progressColor = (p: number) => (p < 20 ? 'red' : p < 70 ? 'orange' : 'teal');

/** Classe Tailwind de la barre de progression selon l'avancement. */
export const progressBarClass = (p: number) =>
    p < 20 ? 'bg-rose-500' : p < 70 ? 'bg-amber-500' : 'bg-emerald-500';

// ─── Formatage ─────────────────────────────────────────────────────────────

/**
 * Sérialise une Date en 'yyyy-MM-dd' en fuseau LOCAL (jamais UTC) : évite le
 * recul d'un jour quand minuit local est converti en ISO UTC pour un
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
