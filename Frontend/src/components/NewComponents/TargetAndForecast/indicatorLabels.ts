/**
 * Libelles et conventions FR du module Indicateurs de performance HSE
 * (Target and Forecast Set). Le backend conserve des codes en anglais
 * (enums IndicatorCategory / IndicatorFrequency / IndicatorDirection et statuts
 * de periode ON_TARGET / OFF_TARGET / PENDING) ; toute la traduction et la
 * palette (charte R7 : violet=en attente, emerald=atteint, rose=manque) sont
 * centralisees ici.
 */

import type {
    IndicatorCategory,
    IndicatorDirection,
    IndicatorFrequency,
} from '../../../services/IndicatorService';

/* ── Categories (ISO 45001) ──────────────────────────────────────────────── */

export const CATEGORY_CONFIG: Record<
    IndicatorCategory,
    { label: string; help: string; chip: string; dot: string }
> = {
    LEADING: {
        label: 'Proactif',
        help: 'Indicateur avance : precede l evenement (remontees, formations, inspections).',
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
    },
    LAGGING: {
        label: 'Reactif',
        help: 'Indicateur de resultat : mesure les consequences (LTIFR, TRIR, accidents).',
        chip: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
    },
    COMMUNITY: {
        label: 'Communautaire',
        help: 'Engagement des parties prenantes et communautes riveraines.',
        chip: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
    },
};

export const categoryConfig = (c?: string | null) =>
    CATEGORY_CONFIG[(c as IndicatorCategory)] ?? {
        label: c ?? '—',
        help: '',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
    };

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_CONFIG) as IndicatorCategory[]).map((value) => ({
    value,
    label: CATEGORY_CONFIG[value].label,
}));

/* ── Frequences ──────────────────────────────────────────────────────────── */

export const FREQUENCY_LABELS: Record<IndicatorFrequency, string> = {
    MONTHLY: 'Mensuelle',
    QUARTERLY: 'Trimestrielle',
    ANNUAL: 'Annuelle',
};

export const frequencyLabel = (f?: string | null): string =>
    f ? FREQUENCY_LABELS[f as IndicatorFrequency] ?? f : '—';

export const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABELS) as IndicatorFrequency[]).map((value) => ({
    value,
    label: FREQUENCY_LABELS[value],
}));

/* ── Direction (sens d amelioration) ─────────────────────────────────────── */

export const DIRECTION_LABELS: Record<IndicatorDirection, string> = {
    LOWER_IS_BETTER: 'Plus bas = mieux',
    HIGHER_IS_BETTER: 'Plus haut = mieux',
};

export const directionLabel = (d?: string | null): string =>
    d ? DIRECTION_LABELS[d as IndicatorDirection] ?? d : '—';

export const DIRECTION_OPTIONS = (Object.keys(DIRECTION_LABELS) as IndicatorDirection[]).map((value) => ({
    value,
    label: DIRECTION_LABELS[value],
}));

/* ── Statut de periode (calcule serveur) ─────────────────────────────────── */

export const PERIOD_STATUS_CONFIG: Record<string, { label: string; chip: string; dot: string }> = {
    ON_TARGET: { label: 'Atteint', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    OFF_TARGET: { label: 'Manque', chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    PENDING: { label: 'En attente', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
};

export const periodStatusConfig = (s?: string | null) =>
    PERIOD_STATUS_CONFIG[(s ?? 'PENDING').toUpperCase()] ?? PERIOD_STATUS_CONFIG.PENDING;

/* ── Localisation des periodes (labels canoniques serveur -> FR) ─────────── */

const MONTH_FR: Record<string, string> = {
    Jan: 'Janvier', Feb: 'Fevrier', Mar: 'Mars', Apr: 'Avril', May: 'Mai', Jun: 'Juin',
    Jul: 'Juillet', Aug: 'Aout', Sep: 'Septembre', Oct: 'Octobre', Nov: 'Novembre', Dec: 'Decembre',
};
const MONTH_FR_SHORT: Record<string, string> = {
    Jan: 'Janv', Feb: 'Fevr', Mar: 'Mars', Apr: 'Avr', May: 'Mai', Jun: 'Juin',
    Jul: 'Juil', Aug: 'Aout', Sep: 'Sept', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec',
};

/** Etiquette FR courte d une periode (pour l en-tete de ligne du tableau). */
export const periodLabelFr = (canonical?: string | null): string => {
    if (!canonical) return '—';
    if (canonical === 'Year') return 'Annee';
    return MONTH_FR_SHORT[canonical] ?? canonical; // Q1..Q4 restent tels quels
};

/** Etiquette FR longue (pour infobulles / accessibilite). */
export const periodLabelFrLong = (canonical?: string | null): string => {
    if (!canonical) return '—';
    if (canonical === 'Year') return 'Cumul annuel';
    if (/^Q[1-4]$/.test(canonical)) return `Trimestre ${canonical.slice(1)}`;
    return MONTH_FR[canonical] ?? canonical;
};

/* ── Formatage numerique ─────────────────────────────────────────────────── */

/** Affiche un nombre compact (jusqu a 2 decimales) ou un tiret si vide. */
export const numOrDash = (v?: number | null): string => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
};

export const variancePctFr = (v?: number | null): string => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const rounded = Number(v.toFixed(1));
    return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

/* ── Style partage ───────────────────────────────────────────────────────── */

export const SECTION_TITLE_STYLE = {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontWeight: 600,
    letterSpacing: '-0.015em',
} as const;

export const CREAM_BG = '#FAF8F3';
