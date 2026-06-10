/**
 * Libellés et conventions du module Gestion des EPI.
 *
 * Le backend conserve des codes historiques en anglais (catégories d'EPI,
 * statuts de demandes, priorités). Toute la traduction et la palette de
 * statuts (charte R7 : violet=en attente, emerald=approuvé/disponible,
 * rose=rejeté/rupture, amber=seuil bas, cyan=livré, slate=inactif) sont
 * centralisées ici.
 */

// ─── Catégories d'EPI (codes backend en anglais) ───────────────────────────

export const PPE_CATEGORY_LABELS: Record<string, string> = {
    'Head protection': 'Protection de la tête',
    'Eye protection': 'Protection des yeux',
    'Hand protection': 'Protection des mains',
    'Foot protection': 'Protection des pieds',
    'Respiratory protection': 'Protection respiratoire',
    'Protective clothing': 'Vêtements de protection',
    'Hearing protection': 'Protection auditive',
    'Fall protection': 'Protection antichute',
};

/** Options prêtes pour <Select> : valeur = code backend, libellé = FR. */
export const PPE_CATEGORY_OPTIONS = Object.entries(PPE_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const ppeCategoryLabel = (code?: string | null): string =>
    code ? PPE_CATEGORY_LABELS[code] ?? code : '—';

// ─── Statut de stock (calculé côté client) ─────────────────────────────────

export type StockBucket = 'AVAILABLE' | 'LOW' | 'OUT';

export const STOCK_STATUS_CONFIG: Record<StockBucket, { label: string; chip: string }> = {
    AVAILABLE: { label: 'Disponible', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    LOW: { label: 'Seuil bas', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    OUT: { label: 'Rupture', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

/** Détermine le statut de stock à partir du stock courant et du seuil minimum. */
export const stockBucket = (stock?: number | null, minStock?: number | null): StockBucket => {
    const s = Number(stock ?? 0);
    if (s <= 0) return 'OUT';
    if (s <= Number(minStock ?? 0)) return 'LOW';
    return 'AVAILABLE';
};

// ─── Statut catalogue d'un EPI (ACTIVE / INACTIVE) ─────────────────────────

export const PPE_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    ACTIVE: { label: 'Actif', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    INACTIVE: { label: 'Inactif', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const ppeStatusConfig = (status?: string | null) =>
    PPE_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Statut d'une dotation EPI (affectation employé) ───────────────────────

export const ASSIGNMENT_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    ACTIVE: { label: 'Affecté', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    INACTIVE: { label: 'Retourné', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
    RETURNED: { label: 'Retourné', chip: 'bg-slate-100 text-slate-600 border-slate-200' },
    REPLACED: { label: 'Remplacé', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    EXPIRED: { label: 'Expiré', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const assignmentStatusConfig = (status?: string | null) =>
    ASSIGNMENT_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Statut d'une demande d'EPI — palette charte R7 ────────────────────────

export const REQUEST_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    APPROVED: { label: 'Approuvée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejetée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    DELIVERED: { label: 'Livrée', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

export const requestStatusConfig = (status?: string | null) =>
    REQUEST_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Priorité d'une demande (codes backend Low / Medium / High) ────────────

export const PRIORITY_CONFIG: Record<string, { label: string; chip: string }> = {
    HIGH: { label: 'Élevée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    MEDIUM: { label: 'Moyenne', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    NORMAL: { label: 'Normale', chip: 'bg-slate-50 text-slate-600 border-slate-200' },
    LOW: { label: 'Faible', chip: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const priorityConfig = (priority?: string | null) =>
    PRIORITY_CONFIG[(priority ?? '').toUpperCase()] ?? {
        label: priority ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

export const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Faible' },
    { value: 'Medium', label: 'Moyenne' },
    { value: 'High', label: 'Élevée' },
];

// ─── Formatage ─────────────────────────────────────────────────────────────

export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Classes communes des chips de statut (charte : bordé, uppercase, compact). */
export const CHIP_BASE = 'inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider';
