/**
 * Libellés et conventions du module Gestion des Risques (LOT 50).
 *
 * Le backend conserve des codes historiques en anglais (statuts OPEN /
 * IN_PROGRESS / CLOSED, niveaux de la matrice "Low" → "High"). Toute la
 * traduction française et la palette charte (R7 + note métier criticité :
 * faible=emerald, modéré=amber, élevé=orange, critique=rose) sont
 * centralisées ici pour l'ensemble des pages du module — le Registre
 * chimique réutilise aussi ces référentiels.
 */

import { riskMap } from '../../Data/DropdownData';

// ─── Statuts des risques (codes backend OPEN / IN_PROGRESS / CLOSED) ───────

export interface ChipConfig {
    label: string;
    /** Classes Tailwind du chip bordé (jamais la couleur seule). */
    chip: string;
}

export const RISK_STATUS_CONFIG: Record<string, ChipConfig> = {
    OPEN: { label: 'Ouvert', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    IN_PROGRESS: { label: 'En traitement', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    CLOSED: { label: 'Clôturé', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/** Normalise un statut backend ("In Progress", "in_progress"…) vers son code canonique. */
export const normalizeRiskStatus = (status?: string | null): string =>
    String(status ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

export const riskStatusConfig = (status?: string | null): ChipConfig =>
    RISK_STATUS_CONFIG[normalizeRiskStatus(status)] ?? {
        label: status ? String(status) : '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

export const RISK_STATUS_OPTIONS = Object.entries(RISK_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

// ─── Niveaux de risque (matrice probabilité × gravité) ─────────────────────

/**
 * Le backend encode le niveau sous forme de clé "pg" (probabilité, gravité)
 * traduite en palier par `riskMap` : Low / Low Med / Medium / Med High / High.
 * Palette charte : faible=emerald, modéré=amber, élevé=orange, critique=rose
 * (+ lime pour le palier intermédiaire "faible à modéré").
 */
export interface RiskLevelConfig extends ChipConfig {
    /** Classes Tailwind des cellules de la matrice. */
    cell: string;
    /** Rang 1 (faible) → 5 (critique), pour les tris et les KPI. */
    rank: number;
}

export const RISK_LEVEL_CONFIG: Record<string, RiskLevelConfig> = {
    Low: {
        label: 'Faible',
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cell: 'bg-emerald-100 text-emerald-900',
        rank: 1,
    },
    'Low Med': {
        label: 'Faible à modéré',
        chip: 'bg-lime-50 text-lime-700 border-lime-200',
        cell: 'bg-lime-100 text-lime-900',
        rank: 2,
    },
    Medium: {
        label: 'Modéré',
        chip: 'bg-amber-50 text-amber-700 border-amber-200',
        cell: 'bg-amber-100 text-amber-900',
        rank: 3,
    },
    'Med High': {
        label: 'Élevé',
        chip: 'bg-orange-50 text-orange-700 border-orange-200',
        cell: 'bg-orange-100 text-orange-900',
        rank: 4,
    },
    High: {
        label: 'Critique',
        chip: 'bg-rose-50 text-rose-700 border-rose-200',
        cell: 'bg-rose-100 text-rose-900',
        rank: 5,
    },
};

/** Options de filtre niveau (valeur = code backend, libellé = FR). */
export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

/** Configuration d'un niveau à partir de la clé matrice ("23", "45"…). */
export const riskLevelFromKey = (key?: string | null): RiskLevelConfig | null => {
    if (!key) return null;
    const level = riskMap[key]?.level as string | undefined;
    return level ? RISK_LEVEL_CONFIG[level] ?? null : null;
};

/** Configuration d'un niveau à partir de son code backend ("Low Med"…). */
export const riskLevelConfig = (level?: string | null): RiskLevelConfig | null =>
    level ? RISK_LEVEL_CONFIG[level] ?? null : null;

// ─── Axes de la matrice ─────────────────────────────────────────────────────

export const PROBABILITY_LABELS_FR = ['Rare', 'Improbable', 'Possible', 'Probable', 'Quasi-certain'];
export const SEVERITY_LABELS_FR = ['Négligeable', 'Mineure', 'Modérée', 'Majeure', 'Catastrophique'];

/** Grille des paliers de la matrice 5×5 (probabilité en ligne, gravité en colonne). */
export const MATRIX_LEVEL_GRID: string[][] = Array.from({ length: 5 }, (_row, p) =>
    Array.from({ length: 5 }, (_col, g) => (riskMap[`${p + 1}${g + 1}`]?.level as string) ?? 'Low')
);

// ─── Échelles d'évaluation (gravité / probabilité / niveau calculé) ─────────

export const GRAVITY_OPTIONS_FR = [
    { value: '1', label: '1 — Négligeable' },
    { value: '2', label: '2 — Mineure' },
    { value: '3', label: '3 — Modérée' },
    { value: '4', label: '4 — Majeure' },
    { value: '5', label: '5 — Catastrophique' },
];

export const PROBABILITY_OPTIONS_FR = [
    { value: '1', label: '1 — Rare' },
    { value: '2', label: '2 — Improbable' },
    { value: '3', label: '3 — Possible' },
    { value: '4', label: '4 — Probable' },
    { value: '5', label: '5 — Quasi-certain' },
];

/** Score 1-5 calculé (rang du palier) affiché dans le champ "Niveau de risque". */
export const LEVEL_SCORE_OPTIONS_FR = [
    { value: '1', label: '1 — Faible' },
    { value: '2', label: '2 — Faible à modéré' },
    { value: '3', label: '3 — Modéré' },
    { value: '4', label: '4 — Élevé' },
    { value: '5', label: '5 — Critique' },
];

export const GRAVITY_LABELS_FR: Record<string, string> = {
    '1': 'Négligeable',
    '2': 'Mineure',
    '3': 'Modérée',
    '4': 'Majeure',
    '5': 'Catastrophique',
};

export const PROBABILITY_VALUE_LABELS_FR: Record<string, string> = {
    '1': 'Rare',
    '2': 'Improbable',
    '3': 'Possible',
    '4': 'Probable',
    '5': 'Quasi-certain',
};

export const LEVEL_SCORE_LABELS_FR: Record<string, string> = {
    '1': 'Faible',
    '2': 'Faible à modéré',
    '3': 'Modéré',
    '4': 'Élevé',
    '5': 'Critique',
};

/** Chips Tailwind pour les scores 1-5 (gravité, probabilité, niveau). */
export const SCORE_CHIP_CLASSES: Record<string, string> = {
    '1': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '2': 'bg-lime-50 text-lime-700 border-lime-200',
    '3': 'bg-amber-50 text-amber-700 border-amber-200',
    '4': 'bg-orange-50 text-orange-700 border-orange-200',
    '5': 'bg-rose-50 text-rose-700 border-rose-200',
};

export const scoreChip = (score?: string | number | null): string =>
    SCORE_CHIP_CLASSES[String(score ?? '')] ?? 'bg-slate-50 text-slate-600 border-slate-200';

// ─── ISO 45001 §6.1.2 — Identification du danger (phase B) ──────────────────

/** Type d'activité (codes backend conservés, libellés FR charte). */
export const ACTIVITY_TYPE_OPTIONS = [
    { value: 'ROUTINE', label: 'Activité routinière' },
    { value: 'NON_ROUTINE', label: 'Activité non routinière' },
];

/** Catégorie de danger (ISO 45001). */
export const HAZARD_CATEGORY_OPTIONS = [
    { value: 'PHYSICAL', label: 'Physique' },
    { value: 'CHEMICAL', label: 'Chimique' },
    { value: 'BIOLOGICAL', label: 'Biologique' },
    { value: 'ERGONOMIC', label: 'Ergonomique' },
    { value: 'PSYCHOSOCIAL', label: 'Psychosocial' },
];

/** Personnes exposées (multi-sélection, sérialisé en CSV au submit). */
export const PERSONS_EXPOSED_OPTIONS = [
    { value: 'WORKERS', label: 'Travailleurs' },
    { value: 'CONTRACTORS', label: 'Sous-traitants' },
    { value: 'VISITORS', label: 'Visiteurs' },
    { value: 'PUBLIC', label: 'Public' },
];

// ─── ISO 45001 §8.1.2 — Hiérarchie des mesures de maîtrise (phase B) ─────────

export interface ControlTierConfig {
    label: string;
    /** Classes Tailwind du chip / bandeau du palier (rampe charte). */
    chip: string;
    /** Rang 1 (Élimination) → 5 (EPI). */
    rank: number;
}

/** Les 5 paliers, du plus efficace (Élimination) au moins efficace (EPI). */
export const CONTROL_TYPE_CONFIG: Record<string, ControlTierConfig> = {
    ELIMINATION: { label: 'Élimination', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', rank: 1 },
    SUBSTITUTION: { label: 'Substitution', chip: 'bg-lime-50 text-lime-700 border-lime-200', rank: 2 },
    ENGINEERING: { label: "Mesures d'ingénierie", chip: 'bg-amber-50 text-amber-700 border-amber-200', rank: 3 },
    ADMINISTRATIVE: { label: 'Mesures administratives', chip: 'bg-orange-50 text-orange-700 border-orange-200', rank: 4 },
    PPE: { label: 'EPI', chip: 'bg-rose-50 text-rose-700 border-rose-200', rank: 5 },
};

/** Ordre d'affichage des paliers (Élimination → EPI). */
export const CONTROL_TYPE_ORDER = ['ELIMINATION', 'SUBSTITUTION', 'ENGINEERING', 'ADMINISTRATIVE', 'PPE'] as const;

export const CONTROL_TYPE_OPTIONS = CONTROL_TYPE_ORDER.map((value) => ({
    value,
    label: CONTROL_TYPE_CONFIG[value].label,
}));

export const controlTypeConfig = (code?: string | null): ControlTierConfig | null =>
    code ? CONTROL_TYPE_CONFIG[code] ?? null : null;

/** Statut d'une mesure de maîtrise. */
export const CONTROL_STATUS_CONFIG: Record<string, ChipConfig> = {
    PLANNED: { label: 'Planifiée', chip: 'bg-slate-50 text-slate-600 border-slate-200' },
    IN_PROGRESS: { label: 'En cours', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    DONE: { label: 'Réalisée', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const CONTROL_STATUS_OPTIONS = Object.entries(CONTROL_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

export const controlStatusConfig = (status?: string | null): ChipConfig =>
    CONTROL_STATUS_CONFIG[String(status ?? '').toUpperCase()] ?? {
        label: status ? String(status) : '—',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
    };

// ─── Formatage ──────────────────────────────────────────────────────────────

export const formatDateFr = (value?: string | Date | null): string => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
