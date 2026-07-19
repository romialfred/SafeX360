import { describe, expect, it } from 'vitest';
import {
    APPROVED_PUBLIC_CLAIMS,
    isPublishablePublicClaim,
    type PublicClaim,
} from './PublicClaimsRegistry';

const completeClaim: PublicClaim = {
    id: 'CLAIM-DEMO-001',
    statement: 'Indicateur mesuré sur un périmètre défini',
    status: 'APPROVED',
    evidence: {
        sourceUrl: 'https://evidence.example.invalid/report/001',
        owner: 'Responsable qualité',
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
        population: 'Périmètre documenté dans le rapport source',
        calculationMethod: 'Formule et exclusions documentées',
        limitations: 'Résultat non extrapolable hors du périmètre',
        validatedBy: 'Validateur indépendant',
        validatedAt: '2026-07-01',
        expiresAt: '2026-12-31',
    },
};

describe('gate des allégations publiques', () => {
    it('ne publie aucun indicateur sans dossier approuvé', () => {
        expect(APPROVED_PUBLIC_CLAIMS).toEqual([]);
    });

    it('accepte seulement un dossier complet, approuvé et non expiré', () => {
        expect(isPublishablePublicClaim(completeClaim, '2026-07-19')).toBe(true);
        expect(isPublishablePublicClaim({ ...completeClaim, status: 'DRAFT' }, '2026-07-19')).toBe(false);
        expect(isPublishablePublicClaim(completeClaim, '2027-01-01')).toBe(false);
        expect(isPublishablePublicClaim({
            ...completeClaim,
            evidence: { ...completeClaim.evidence, limitations: '' },
        }, '2026-07-19')).toBe(false);
    });
});

