/**
 * computeAvailableActions.test.ts — P2.1 Frontend.
 *
 * Vitest test suite pour le helper pur extrait de BlastDetailPage.
 *
 * <p>Objet : valider la logique "site degage" refactorisee (issue P2.1) :
 *   1) statut FIRED → bouton actionnable
 *   2) statut MISFIRE non resolu → bouton visible mais disabled
 *   3) statut MISFIRE resolu (misfireResolvedAt non null) → actionnable
 *
 * Ces trois cas sont les 3 cas exiges par l'audit P2.1.
 */

import { describe, it, expect } from 'vitest';

import {
    computeAvailableActions,
    type BlastActionsInput,
} from '../../../components/Blast/BlastDetailPage';

const baseInput = (
    overrides: Partial<BlastActionsInput> = {},
): BlastActionsInput => ({
    status: 'FIRED',
    misfireResolvedAt: null,
    canPlan: true,
    canConfirm: true,
    canAdmin: false,
    ...overrides,
});

describe('computeAvailableActions — bouton "Site degage" (P2.1)', () => {
    it('FIRED + canConfirm → bouton visible ET actionnable', () => {
        const r = computeAvailableActions(baseInput({ status: 'FIRED' }));
        expect(r.allClear).toBe(true);
        expect(r.allClearActionable).toBe(true);
    });

    it('MISFIRE non resolu (misfireResolvedAt null) → visible mais disabled', () => {
        const r = computeAvailableActions(
            baseInput({ status: 'MISFIRE', misfireResolvedAt: null }),
        );
        expect(r.allClear).toBe(true);
        expect(r.allClearActionable).toBe(false);
    });

    it('MISFIRE resolu (misfireResolvedAt non null) → visible ET actionnable', () => {
        const r = computeAvailableActions(
            baseInput({
                status: 'MISFIRE',
                misfireResolvedAt: '2026-06-08T10:00:00',
            }),
        );
        expect(r.allClear).toBe(true);
        expect(r.allClearActionable).toBe(true);
    });
});

describe('computeAvailableActions — visibilite hors phase d\'inspection', () => {
    it.each(['DRAFT', 'PLANNED', 'CONFIRMED', 'IMMINENT', 'ALL_CLEAR', 'CANCELLED', 'POSTPONED'] as const)(
        '%s → bouton "site degage" non affiche',
        (status) => {
            const r = computeAvailableActions(baseInput({ status }));
            expect(r.allClear).toBe(false);
            expect(r.allClearActionable).toBe(false);
        },
    );

    it('Sans BLAST_CONFIRM, le bouton n\'apparait pas meme en FIRED', () => {
        const r = computeAvailableActions(
            baseInput({ status: 'FIRED', canConfirm: false }),
        );
        expect(r.allClear).toBe(false);
        expect(r.allClearActionable).toBe(true); // pure logique etat -> true
    });
});

describe('computeAvailableActions — autres actions (non-regression)', () => {
    it('DRAFT + BLAST_CONFIRM → action "confirm" disponible', () => {
        const r = computeAvailableActions(baseInput({ status: 'DRAFT' }));
        expect(r.confirm).toBe(true);
        expect(r.fired).toBe(false);
        expect(r.misfire).toBe(false);
    });

    it('PLANNED + BLAST_PLAN → reschedule et cancel disponibles', () => {
        const r = computeAvailableActions(baseInput({ status: 'PLANNED' }));
        expect(r.reschedule).toBe(true);
        expect(r.cancel).toBe(true);
    });

    it('ALL_CLEAR → evacReport visible', () => {
        const r = computeAvailableActions(baseInput({ status: 'ALL_CLEAR' }));
        expect(r.evacReport).toBe(true);
    });

    it('CANCELLED → toutes actions metier desactivees', () => {
        const r = computeAvailableActions(baseInput({ status: 'CANCELLED' }));
        expect(r.confirm).toBe(false);
        expect(r.cancel).toBe(false);
        expect(r.allClear).toBe(false);
    });
});
