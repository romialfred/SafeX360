/**
 * riskLevel — Résolution des paliers de risque côté mobile.
 *
 * Le backend stocke Risk.riskLevel comme CLÉ MATRICE « pg » à deux chiffres
 * (« 11 »…« 55 », probabilité × gravité — validé par ^[1-5][1-5]$ dans
 * Risk.java). Les libellés « Low » / « Med High »… ne sont JAMAIS émis par
 * l'API : ils sont dérivés de la matrice 5×5 ci-dessous, copie conforme de
 * riskMap (src/Data/DropdownData.tsx) utilisée par le module web.
 */

export type RiskLevelKey = 'Low' | 'Low Med' | 'Medium' | 'Med High' | 'High';

const MATRIX: Record<string, RiskLevelKey> = {
    '11': 'Low', '12': 'Low', '13': 'Low', '14': 'Low', '15': 'Low Med',
    '21': 'Low', '22': 'Low', '23': 'Low Med', '24': 'Low Med', '25': 'Medium',
    '31': 'Low', '32': 'Low Med', '33': 'Low Med', '34': 'Medium', '35': 'Med High',
    '41': 'Low', '42': 'Low Med', '43': 'Medium', '44': 'Med High', '45': 'High',
    '51': 'Low Med', '52': 'Medium', '53': 'Med High', '54': 'High', '55': 'High',
};

/**
 * Palier à partir de la valeur brute backend : clé matrice (« 23 ») en
 * priorité, tolère aussi un libellé déjà résolu (« Med High ») pour les
 * données legacy. Retourne null si irrésoluble (pas de repli silencieux).
 */
export function resolveRiskLevel(raw?: string | null): RiskLevelKey | null {
    const v = String(raw ?? '').trim();
    if (!v) return null;
    if (/^[1-5][1-5]$/.test(v)) return MATRIX[v] ?? null;
    const known: RiskLevelKey[] = ['Low', 'Low Med', 'Medium', 'Med High', 'High'];
    return known.find((k) => k.toLowerCase() === v.toLowerCase()) ?? null;
}

/** Libellés FR par palier (alignés module web riskLabels.ts). */
export const RISK_LEVEL_LABEL_FR: Record<RiskLevelKey, string> = {
    Low: 'Faible',
    'Low Med': 'Faible à modéré',
    Medium: 'Modéré',
    'Med High': 'Élevé',
    High: 'Critique',
};

/** Familles d'agrégation pour les KPI de synthèse (3 compteurs). */
export function riskLevelFamily(level: RiskLevelKey | null): 'LOW' | 'MEDIUM' | 'HIGH' | null {
    if (!level) return null;
    if (level === 'Low' || level === 'Low Med') return 'LOW';
    if (level === 'Medium') return 'MEDIUM';
    return 'HIGH';
}
