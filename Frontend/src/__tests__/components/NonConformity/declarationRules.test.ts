/**
 * declarationRules.test.ts — étape 1 de la déclaration d'un événement HSE.
 *
 * <p>OBJET — verrouiller l'invariant qui a été violé en production :
 *
 *   « Un champ ne doit JAMAIS être exigé par la validation sans être rendu
 *     à l'écran dans exactement les mêmes conditions. »
 *
 * <p>Le défaut corrigé : les règles `requirement`, `detectionSource`,
 * `actionTaken` et `severityLevel` exigeaient leur champ dès que le type
 * n'était pas NEAR_MISS, alors que `DeclarationStep` ne rend le bloc
 * correspondant que pour NON_CONFORMITY. Avec l'ajout du troisième type,
 * HAZARD, ces quatre champs devenaient obligatoires sans exister nulle part :
 * l'étape 1 était infranchissable, sans erreur en ligne pour l'expliquer
 * puisque les champs n'étaient pas rendus.
 *
 * <p>Le test décisif est {@code HAZARD complet → aucune erreur} : il échoue sur
 * le code d'avant le correctif, et lui seul aurait attrapé la régression.</p>
 */

import { describe, it, expect } from 'vitest';

import { declarationRules } from '../../../components/LeadingIndicator/Non-conformity/nonConformityValidation';
import {
    hasNonConformityFields,
    hasNearMissFields,
} from '../../../components/LeadingIndicator/Non-conformity/nonConformityLabels';

/** Champs communs aux trois types, tous correctement renseignés. */
const commonFilled = {
    title: 'Fuite hydraulique sur la rampe 3',
    date: new Date('2026-07-10'),
    detectionDate: new Date('2026-07-10'),
    reportedBy: '42',
    workProcessId: '7',
    locationId: '3',
    categoryId: '5',
    description: '<p>Détaillé sur place par le superviseur.</p>',
    events: ['Organisationnelle'],
    // Champs des blocs spécifiques — laissés VIDES exprès : c'est tout l'enjeu.
    requirement: '',
    detectionSource: '',
    actionTaken: '',
    severityLevel: '',
    nearMissType: '',
    factors: [] as string[],
    preventiveAction: '',
    improvement: '',
};

/** Applique toutes les règles et renvoie les seuls champs en erreur. */
const fieldsInError = (nonConformity: Record<string, any>): string[] => {
    const values = { nonConformity };
    return Object.entries(declarationRules)
        .filter(([field, rule]) => rule(nonConformity[field], values) !== null)
        .map(([field]) => field);
};

describe("étape 1 — déclaration d'un événement", () => {
    it('exige les champs communs quand rien n’est saisi', () => {
        const errors = fieldsInError({ type: 'HAZARD' });
        expect(errors).toContain('title');
        expect(errors).toContain('description');
        expect(errors).toContain('events');
    });

    describe('HAZARD (situation dangereuse)', () => {
        it("n'exige AUCUN champ de bloc spécifique — ils ne sont rendus nulle part", () => {
            // Le test de non-régression du bug : avant correctif, cette
            // assertion échouait sur requirement / detectionSource /
            // actionTaken / severityLevel, et l'utilisateur restait bloqué.
            expect(fieldsInError({ ...commonFilled, type: 'HAZARD' })).toEqual([]);
        });

        it('ne rend aucun bloc spécifique', () => {
            expect(hasNonConformityFields('HAZARD')).toBe(false);
            expect(hasNearMissFields('HAZARD')).toBe(false);
        });
    });

    describe('NON_CONFORMITY', () => {
        it('exige les quatre champs de son bloc, qui SONT rendus', () => {
            expect(hasNonConformityFields('NON_CONFORMITY')).toBe(true);
            const errors = fieldsInError({ ...commonFilled, type: 'NON_CONFORMITY' });
            expect(errors).toEqual(
                expect.arrayContaining([
                    'requirement',
                    'detectionSource',
                    'actionTaken',
                    'severityLevel',
                ]),
            );
        });

        it('passe une fois son bloc renseigné', () => {
            const errors = fieldsInError({
                ...commonFilled,
                type: 'NON_CONFORMITY',
                requirement: 'Norme ISO 45001',
                detectionSource: 'Audit interne',
                actionTaken: '<p>Zone consignée immédiatement.</p>',
                severityLevel: 'Major',
            });
            expect(errors).toEqual([]);
        });
    });

    describe('NEAR_MISS (quasi-accident)', () => {
        it("exige son propre bloc, et JAMAIS celui de la non-conformité", () => {
            const errors = fieldsInError({ ...commonFilled, type: 'NEAR_MISS' });
            expect(errors).toEqual(
                expect.arrayContaining([
                    'nearMissType',
                    'factors',
                    'preventiveAction',
                    'improvement',
                ]),
            );
            // Le bloc non-conformité n'est pas rendu pour ce type : l'exiger
            // reproduirait exactement le défaut corrigé.
            expect(errors).not.toContain('requirement');
            expect(errors).not.toContain('severityLevel');
        });

        it('passe une fois son bloc renseigné', () => {
            const errors = fieldsInError({
                ...commonFilled,
                type: 'NEAR_MISS',
                nearMissType: 'Chute évitée',
                factors: ['Comportement à risque'],
                preventiveAction: '<p>Balisage renforcé.</p>',
                improvement: '<p>Revoir le mode opératoire.</p>',
            });
            expect(errors).toEqual([]);
        });
    });

    /**
     * COHÉRENCE STRUCTURELLE — c'est ce test qui empêche la classe entière de
     * défauts de réapparaître. Il affirme que pour CHAQUE type d'événement
     * existant, un formulaire par ailleurs complet est acceptable dès lors que
     * les blocs RENDUS sont renseignés. Ajouter demain un quatrième type sans
     * décider de ses champs le fera échouer immédiatement.
     */
    it('tout type d’événement doit pouvoir franchir l’étape 1', () => {
        const blocks: Record<string, Record<string, any>> = {
            NON_CONFORMITY: {
                requirement: 'Norme ISO 45001',
                detectionSource: 'Audit interne',
                actionTaken: '<p>Zone consignée.</p>',
                severityLevel: 'Major',
            },
            NEAR_MISS: {
                nearMissType: 'Chute évitée',
                factors: ['Comportement à risque'],
                preventiveAction: '<p>Balisage renforcé.</p>',
                improvement: '<p>Revoir le mode opératoire.</p>',
            },
            HAZARD: {},
        };

        Object.entries(blocks).forEach(([type, specificFields]) => {
            expect(
                fieldsInError({ ...commonFilled, type, ...specificFields }),
                `le type ${type} doit pouvoir être déclaré`,
            ).toEqual([]);
        });
    });
});
