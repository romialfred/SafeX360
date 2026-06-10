/**
 * Libellés et conventions du module Actions Correctives (CAPA).
 *
 * Le backend conserve des codes historiques en anglais (PENDING,
 * INCIDENT…). Toute la traduction française et la palette de statuts
 * (charte R7) sont centralisées ici pour les pages du module.
 */

// ─── Statuts d'une action corrective ───────────────────────────────────────
// Charte R7 : violet = en attente, amber = en cours, emerald = réalisé,
// rose = annulé. L'ordre des entrées est significatif : il représente la
// progression du cycle de vie (utilisé pour restreindre le Select de mise
// à jour aux statuts atteignables).

export const CA_STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    CANCELLED: { label: 'Annulée', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    COMPLETED: { label: 'Réalisée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const caStatusConfig = (status?: string | null) =>
    CA_STATUS_CONFIG[(status ?? '').toUpperCase()] ?? {
        label: status ?? '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

/**
 * Options prêtes pour <Select>, même ordre que le référentiel historique
 * actionStatuses (PENDING → IN_PROGRESS → CANCELLED → COMPLETED).
 */
export const CA_STATUS_OPTIONS = Object.entries(CA_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

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
