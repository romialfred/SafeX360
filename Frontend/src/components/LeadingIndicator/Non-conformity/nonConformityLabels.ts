/**
 * Libellés et palette du module Non-conformités / Constats centraux.
 *
 * Centralise (charte R7) :
 *   - les libellés FR des statuts du cycle de vie (le backend stocke
 *     REPORTED / ANALYSIS / AC_IMPLEMENTATION / CLOSED / CANCELLED / REJECTED),
 *   - les couleurs Mantine et chips Tailwind associées,
 *   - les chips de sévérité et de priorité.
 *
 * Palette R7 : cyan = déclaré/planifié · amber = en analyse (en cours) ·
 * orange = en traitement · emerald = clôturé · slate = annulé · rose/rouge = rejeté.
 */

// ─── Statuts du cycle de vie ────────────────────────────────────────────────

export const NC_STATUS_LABELS: Record<string, string> = {
    REPORTED: 'Déclaré',
    ANALYSIS: 'Analyse',
    AC_IMPLEMENTATION: 'Traitement',
    CLOSED: 'Clôturé',
    CANCELLED: 'Annulé',
    REJECTED: 'Rejeté',
};

export const ncStatusLabel = (status?: string | null): string =>
    NC_STATUS_LABELS[String(status ?? '').toUpperCase()] ?? String(status ?? '—');

/** Couleurs Mantine (Badge). 'amber' est une couleur custom du thème SafeX. */
export const NC_STATUS_COLORS: Record<string, string> = {
    REPORTED: 'cyan',
    ANALYSIS: 'amber',
    AC_IMPLEMENTATION: 'orange',
    CLOSED: 'green',
    CANCELLED: 'gray',
    REJECTED: 'red',
};

export const ncStatusColor = (status?: string | null): string =>
    NC_STATUS_COLORS[String(status ?? '').toUpperCase()] ?? 'gray';

/** Chips Tailwind (cartes / tuiles). */
export const NC_STATUS_CHIPS: Record<string, string> = {
    REPORTED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    ANALYSIS: 'bg-amber-50 text-amber-700 border-amber-200',
    AC_IMPLEMENTATION: 'bg-orange-50 text-orange-700 border-orange-200',
    CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ncStatusChip = (status?: string | null): string =>
    NC_STATUS_CHIPS[String(status ?? '').toUpperCase()] ?? 'bg-slate-50 text-slate-700 border-slate-200';

/** Options FR pour les filtres / Select (valeurs backend conservées). */
export const NC_STATUS_OPTIONS = [
    { value: 'REPORTED', label: 'Déclaré' },
    { value: 'ANALYSIS', label: 'Analyse' },
    { value: 'AC_IMPLEMENTATION', label: 'Traitement' },
    { value: 'CLOSED', label: 'Clôturé' },
    { value: 'CANCELLED', label: 'Annulé' },
];

// ─── Priorités (stockées en FR : Urgente / Élevée / Normale / Faible) ──────

export const NC_PRIORITY_COLORS: Record<string, string> = {
    Urgente: 'red',
    Élevée: 'orange',
    Normale: 'yellow',
    Faible: 'green',
};

export const ncPriorityColor = (priority?: string | null): string =>
    NC_PRIORITY_COLORS[String(priority ?? '')] ?? 'gray';

/** Chips Tailwind statiques (les classes dynamiques `text-${x}-700` ne sont
 *  pas générées par Tailwind — utiliser ces classes complètes). */
export const NC_PRIORITY_CHIPS: Record<string, string> = {
    Urgente: 'bg-white text-red-700 border-red-200',
    Élevée: 'bg-white text-orange-700 border-orange-200',
    Normale: 'bg-white text-yellow-700 border-yellow-200',
    Faible: 'bg-white text-green-700 border-green-200',
};

export const ncPriorityChip = (priority?: string | null): string =>
    NC_PRIORITY_CHIPS[String(priority ?? '')] ?? 'bg-white text-slate-700 border-slate-200';
