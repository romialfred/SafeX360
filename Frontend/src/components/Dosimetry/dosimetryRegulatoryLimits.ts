import type { ThresholdDTO, ThresholdGrandeur } from '../../services/DosimetryService';

const normalizeCategory = (category?: string | null): string | null => {
    if (!category) return null;
    if (category === 'A') return 'WORKER_A';
    if (category === 'B') return 'WORKER_B';
    return category;
};

const scopedActiveThresholds = (
    thresholds: ThresholdDTO[] | undefined,
    category?: string | null,
    mineId?: number | null,
    grandeur: ThresholdGrandeur = 'HP10',
): ThresholdDTO[] => {
    const normalizedCategory = normalizeCategory(category);
    return (thresholds ?? [])
        .filter((threshold) => {
            if (threshold.active === false || threshold.grandeur !== grandeur) return false;
            if (normalizedCategory && normalizeCategory(threshold.personCategory) !== normalizedCategory) return false;
            if (mineId != null && threshold.mineId != null && Number(threshold.mineId) !== Number(mineId)) return false;
            return true;
        })
        .sort((left, right) => {
            if (mineId == null) return 0;
            const leftMineSpecific = Number(left.mineId) === Number(mineId) ? 1 : 0;
            const rightMineSpecific = Number(right.mineId) === Number(mineId) ? 1 : 0;
            return rightMineSpecific - leftMineSpecific;
        });
};

/**
 * Retourne uniquement une limite Hp(10) active et explicitement configurée.
 * La protection WORKER_B=6 couvre aussi une base legacy non encore migrée :
 * 6 mSv est un seuil de classification et ne doit jamais piloter les calculs.
 */
export const resolveConfiguredRegulatoryLimit = (
    thresholds: ThresholdDTO[] | undefined,
    category?: string | null,
    mineId?: number | null,
    grandeur: ThresholdGrandeur = 'HP10',
): number | null => {
    const normalizedCategory = normalizeCategory(category);
    const match = scopedActiveThresholds(thresholds, category, mineId, grandeur)
        .find((threshold) => {
            if (threshold.regulatoryLimit == null || threshold.regulatoryLimit <= 0) return false;
            const effectiveCategory = normalizedCategory ?? normalizeCategory(threshold.personCategory);
            return effectiveCategory !== 'WORKER_B'
                || Math.abs(Number(threshold.regulatoryLimit) - 6) >= 0.000001;
        });
    if (!match) return null;
    return Number(match.regulatoryLimit);
};

export const resolveClassificationThreshold = (
    thresholds: ThresholdDTO[] | undefined,
    category?: string | null,
    mineId?: number | null,
    grandeur: ThresholdGrandeur = 'HP10',
): number | null => {
    const match = scopedActiveThresholds(thresholds, category, mineId, grandeur)
        .find((threshold) => threshold.classificationThreshold != null && threshold.classificationThreshold > 0);
    return match ? Number(match.classificationThreshold) : null;
};
