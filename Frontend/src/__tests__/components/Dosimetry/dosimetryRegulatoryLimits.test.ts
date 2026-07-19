import { describe, expect, it } from 'vitest';
import type { ThresholdDTO } from '../../../services/DosimetryService';
import {
    resolveClassificationThreshold,
    resolveConfiguredRegulatoryLimit,
} from '../../../components/Dosimetry/dosimetryRegulatoryLimits';

const threshold = (
    personCategory: string,
    regulatoryLimit: number | null,
    classificationThreshold: number | null = null,
    mineId: number | null = null,
): ThresholdDTO => ({
    mineId,
    grandeur: 'HP10',
    personCategory,
    classificationThreshold,
    regulatoryLimit,
    unit: 'mSv',
    referenceFramework: 'CUSTOM',
    active: true,
});

describe('AUD-REG-002 — sémantique réglementaire catégorie B', () => {
    it('ne présente jamais le seuil de classification WORKER_B=6 comme limite', () => {
        const migrated = threshold('WORKER_B', null, 6);

        expect(resolveClassificationThreshold([migrated], 'WORKER_B')).toBe(6);
        expect(resolveConfiguredRegulatoryLimit([migrated], 'WORKER_B')).toBeNull();
    });

    it('neutralise aussi une ancienne donnée WORKER_B regulatoryLimit=6', () => {
        expect(resolveConfiguredRegulatoryLimit(
            [threshold('WORKER_B', 6, 6)],
            'WORKER_B',
        )).toBeNull();
    });

    it('accepte une limite WORKER_B distincte validée localement', () => {
        expect(resolveConfiguredRegulatoryLimit(
            [threshold('WORKER_B', 12, 6)],
            'WORKER_B',
        )).toBe(12);
    });

    it('conserve 6 mSv comme limite pour APPRENTICE uniquement', () => {
        expect(resolveConfiguredRegulatoryLimit(
            [threshold('APPRENTICE', 6)],
            'APPRENTICE',
        )).toBe(6);
    });

    it('privilégie le seuil actif de la mine sur le seuil global', () => {
        const thresholds = [
            threshold('WORKER_A', 20, null, null),
            threshold('WORKER_A', 18, null, 7),
        ];

        expect(resolveConfiguredRegulatoryLimit(thresholds, 'WORKER_A', 7)).toBe(18);
        expect(resolveConfiguredRegulatoryLimit(thresholds, 'WORKER_A', 8)).toBe(20);
    });

    it('ignore le legacy B=6 de la mine et conserve une limite globale validée', () => {
        const thresholds = [
            threshold('WORKER_B', 12, 6, null),
            threshold('WORKER_B', 6, 6, 7),
        ];

        expect(resolveConfiguredRegulatoryLimit(thresholds, 'WORKER_B', 7)).toBe(12);
    });
});
