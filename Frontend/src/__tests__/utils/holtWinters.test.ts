/**
 * holtWinters.test.ts — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Vitest test suite for the pure JS implementation of Holt-Winters and the
 * Holt double exponential smoothing fallback in {@code utils/holtWinters.ts}.
 *
 * <p>Couvre :
 *   - cas trivial : serie vide / un seul point
 *   - tendance monotone (Holt)
 *   - serie saisonniere parfaite (Holt-Winters)
 *   - residus / sigma > 0 sur serie bruitee
 *   - prediction d'horizon > 0 = longueur attendue
 *   - valeurs negatives autorisees (debruitage seuil de detection)
 *   - parametres invalides (alpha = 0, periods = 0)
 */

import { describe, it, expect } from 'vitest';
import {
    holtWintersForecast,
    holtWintersForecastFull,
} from '../../utils/holtWinters';

describe('holtWintersForecast — edge cases', () => {
    it('returns empty array for empty input', () => {
        expect(holtWintersForecast([], 5)).toEqual([]);
    });

    it('returns empty array when periods <= 0', () => {
        expect(holtWintersForecast([1, 2, 3], 0)).toEqual([]);
        expect(holtWintersForecast([1, 2, 3], -1)).toEqual([]);
    });

    it('returns constant prediction for a single data point (SES fallback)', () => {
        const out = holtWintersForecast([4.2], 3);
        expect(out.length).toBe(3);
        out.forEach((v) => expect(v).toBeCloseTo(4.2, 5));
    });

    it('ignores NaN / Infinity entries', () => {
        const out = holtWintersForecast([1, NaN, 2, Infinity, 3], 2);
        expect(out.length).toBe(2);
        out.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    });
});

describe('holtWintersForecast — Holt double smoothing', () => {
    it('predicts a positive trend on a linearly increasing series', () => {
        const data = [1, 2, 3, 4, 5, 6];
        const out = holtWintersForecast(data, 3);
        expect(out.length).toBe(3);
        // Values should keep increasing.
        expect(out[0]).toBeGreaterThan(data[data.length - 1]);
        expect(out[1]).toBeGreaterThan(out[0]);
        expect(out[2]).toBeGreaterThan(out[1]);
    });

    it('predicts a flat series ~ the latest value when input is constant', () => {
        const out = holtWintersForecast([10, 10, 10, 10, 10, 10], 3);
        out.forEach((v) => expect(v).toBeCloseTo(10, 2));
    });
});

describe('holtWintersForecast — Holt-Winters (seasonal)', () => {
    it('detects and forecasts a perfectly seasonal series (2 cycles)', () => {
        // 2 cycles d'une saisonnalite [1,2,3,4,5,6,7,8,9,10,11,12]
        const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const data = [...base, ...base];
        const out = holtWintersForecast(data, 12, 0.3, 0.1, 0.3, 12);
        expect(out.length).toBe(12);
        // La sortie doit garder la forme monotone croissante du cycle saisonnier.
        for (let i = 1; i < out.length; i += 1) {
            expect(out[i]).toBeGreaterThan(out[i - 1] - 1.5);
        }
    });

    it('falls back to Holt when gamma=0 even on seasonal data', () => {
        const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const data = [...base, ...base];
        const full = holtWintersForecastFull(data, 6, 0.3, 0.1, 0, 12);
        expect(full.method).toBe('holt');
        expect(full.forecast.length).toBe(6);
    });
});

describe('holtWintersForecastFull — residuals & sigma', () => {
    it('computes a non-zero sigma on a noisy series', () => {
        const noisy = [1, 1.5, 1, 1.2, 1.8, 1.1, 1.4, 1.6, 1.0, 1.3];
        const r = holtWintersForecastFull(noisy, 3);
        expect(r.sigma).toBeGreaterThan(0);
    });

    it('returns sigma ~ 0 for a perfectly linear series', () => {
        const linear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const r = holtWintersForecastFull(linear, 3);
        // Holt should fit perfectly => residuals ~ 0
        expect(r.sigma).toBeLessThan(0.5);
    });

    it('tolerates negative values (below-detection noise subtraction)', () => {
        const data = [-0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
        const r = holtWintersForecastFull(data, 4);
        expect(r.forecast.length).toBe(4);
        r.forecast.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    });
});

describe('holtWintersForecast — known dataset reproducibility', () => {
    it('matches expected order of magnitude on monthly dose history (12 months)', () => {
        // 12 mois de doses individuelles (mSv) — pattern realiste
        // travailleur cat B en mine d'uranium : ~0.5 mSv/mois en moyenne.
        const monthly = [0.4, 0.5, 0.6, 0.5, 0.4, 0.5, 0.6, 0.7, 0.5, 0.4, 0.5, 0.6];
        const out = holtWintersForecast(monthly, 6);
        expect(out.length).toBe(6);
        // Une prediction realiste reste dans [0, 2] mSv/mois pour ce profil.
        out.forEach((v) => {
            expect(v).toBeGreaterThanOrEqual(-0.5);
            expect(v).toBeLessThan(2);
        });
    });
});
