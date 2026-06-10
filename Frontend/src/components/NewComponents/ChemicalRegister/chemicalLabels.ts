/**
 * Libellés et conventions du module Registre chimique (LOT 50).
 *
 * Les classifications et sources de danger sont stockées en anglais côté
 * backend (champ texte libre du DTO ChemicalRisk). La traduction française
 * — alignée sur les classes SGH/CLP réelles — et la palette charte sont
 * centralisées ici. Les référentiels communs au domaine risque (statuts,
 * niveaux de la matrice, échelles d'évaluation) proviennent de
 * `RiskManagement/riskLabels`.
 */

export {
    RISK_STATUS_CONFIG,
    RISK_STATUS_OPTIONS,
    riskStatusConfig,
    normalizeRiskStatus,
    RISK_LEVEL_CONFIG,
    RISK_LEVEL_OPTIONS,
    riskLevelConfig,
    riskLevelFromKey,
    PROBABILITY_LABELS_FR,
    SEVERITY_LABELS_FR,
    MATRIX_LEVEL_GRID,
    GRAVITY_OPTIONS_FR,
    PROBABILITY_OPTIONS_FR,
    LEVEL_SCORE_OPTIONS_FR,
    GRAVITY_LABELS_FR,
    PROBABILITY_VALUE_LABELS_FR,
    LEVEL_SCORE_LABELS_FR,
    scoreChip,
    formatDateFr,
} from '../../RiskManagement/riskLabels';

// ─── Classification SGH (codes backend en anglais, conservés en base) ───────

export interface SghConfig {
    /** Classe de danger SGH/CLP correspondante. */
    sgh: string;
    label: string;
    /** Classes Tailwind du chip bordé. */
    chip: string;
}

export const CLASSIFICATION_CONFIG: Record<string, SghConfig> = {
    Explosive: { sgh: 'SGH01', label: 'Explosif', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    Flammable: { sgh: 'SGH02', label: 'Inflammable', chip: 'bg-orange-50 text-orange-700 border-orange-200' },
    Oxidizing: { sgh: 'SGH03', label: 'Comburant', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    Corrosive: { sgh: 'SGH05', label: 'Corrosif', chip: 'bg-slate-100 text-slate-700 border-slate-300' },
    Toxic: { sgh: 'SGH06', label: 'Toxicité aiguë', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    Irritant: { sgh: 'SGH07', label: 'Nocif / irritant', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    Carcinogenic: { sgh: 'SGH08', label: 'Cancérogène', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    Mutagenic: { sgh: 'SGH08', label: 'Mutagène', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Reproductive Toxin': { sgh: 'SGH08', label: 'Toxique pour la reproduction', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Environmental Hazard': { sgh: 'SGH09', label: "Danger pour l'environnement", chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/** Options <Select> : valeur = code backend, libellé = "SGH0x · Libellé FR". */
export const CLASSIFICATION_OPTIONS = Object.entries(CLASSIFICATION_CONFIG).map(([value, cfg]) => ({
    value,
    label: `${cfg.sgh} · ${cfg.label}`,
}));

export const classificationConfig = (code?: string | null): SghConfig | null =>
    code ? CLASSIFICATION_CONFIG[code] ?? null : null;

export const classificationLabel = (code?: string | null): string => {
    if (!code) return '—';
    const cfg = CLASSIFICATION_CONFIG[code];
    return cfg ? `${cfg.sgh} · ${cfg.label}` : code;
};

// ─── Sources de danger (codes backend en anglais) ───────────────────────────

export const HAZARD_SOURCE_LABELS: Record<string, string> = {
    Storage: 'Stockage',
    Handling: 'Manipulation',
    Transport: 'Transport',
    Mixing: 'Mélange',
    Heating: 'Chauffage',
    Disposal: 'Élimination des déchets',
    Maintenance: 'Maintenance',
    'Emergency Response': "Intervention d'urgence",
};

export const HAZARD_SOURCE_OPTIONS = Object.entries(HAZARD_SOURCE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const hazardSourceLabel = (code?: string | null): string =>
    code ? HAZARD_SOURCE_LABELS[code] ?? code : '—';
