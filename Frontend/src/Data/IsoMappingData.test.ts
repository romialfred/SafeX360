import { describe, expect, it } from 'vitest';
import {
    ISO_CLAUSES,
    ISO_REGISTRY_VERSION,
    ISO_STANDARDS,
    ORGANIZATIONAL_PROCESS_CONTROLS,
    coverageStats,
} from './IsoMappingData';

describe('registre ISO contrôlé', () => {
    it('référence les éditions publiées vérifiées au 19 juillet 2026', () => {
        const editions = Object.fromEntries(ISO_STANDARDS.map((standard) => [standard.code, standard.year]));
        expect(editions['ISO 19011']).toBe(2026);
        expect(editions['ISO 14001']).toBe(2026);
        expect(editions['ISO 45001']).toBe(2018);
        expect(editions['ISO 9001']).toBe(2015);
        expect(ISO_STANDARDS.every((standard) => standard.officialSource.startsWith('https://www.iso.org/'))).toBe(true);
        expect(ISO_STANDARDS.every((standard) => standard.ownerRole && standard.reviewedAt && standard.nextReviewDate)).toBe(true);
        expect(ISO_STANDARDS.every((standard) => standard.approvalStatus === 'PENDING_HUMAN_APPROVAL')).toBe(true);
        expect(ISO_REGISTRY_VERSION).toMatch(/^\d{4}\.\d{2}\.\d{2}-\d+$/);
    });

    it('utilise des identifiants composites uniques et aucune pseudo-clause EPI', () => {
        const ids = ISO_CLAUSES.map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ISO_CLAUSES.some((item) => item.code === '8.1.2.PPE')).toBe(false);
        expect(coverageStats().total).toBe(ids.length);
    });

    it('instrumente toutes les zones ISO 45001 identifiées comme manquantes dans l’audit', () => {
        const codes = new Set(ISO_CLAUSES.filter((item) => item.standard === 'ISO 45001').map((item) => item.code));
        const required = ['4.2', '4.3', '4.4', '5.2', '5.3', '5.4', '6.1.1', '6.1.4', '7.1', '8.1.1', '8.1.3', '8.1.4', '9.1.2', '9.3', '10.1'];
        required.forEach((code) => expect(codes.has(code), `clause ${code}`).toBe(true));
    });

    it('ne transforme jamais un support produit en résultat de conformité', () => {
        expect(ISO_CLAUSES.every((item) => ['NOT_SUPPORTED', 'SUPPORTED'].includes(item.maturity))).toBe(true);
        expect(ISO_CLAUSES.filter((item) => item.productSupport === 'OUTSIDE_PRODUCT').every((item) => item.maturity === 'NOT_SUPPORTED')).toBe(true);
        expect(ISO_CLAUSES.every((item) => item.result.includes('Non évalué'))).toBe(true);
        expect(ISO_CLAUSES.every((item) => item.ownerRole && item.expectedEvidence && item.controlMethod && item.gap)).toBe(true);
    });

    it('documente les contrôles et résiduels des processus organisationnels', () => {
        expect(ORGANIZATIONAL_PROCESS_CONTROLS).toHaveLength(9);
        expect(new Set(ORGANIZATIONAL_PROCESS_CONTROLS.map((item) => item.id)).size).toBe(9);
        expect(ORGANIZATIONAL_PROCESS_CONTROLS.every((item) =>
            item.ownerRole
            && item.inputs
            && item.decisions
            && item.participants
            && item.signedEvidence
            && item.dueRule
            && item.versioning
            && item.retention
            && item.effectivenessIndicator
            && item.residual,
        )).toBe(true);
    });
});
