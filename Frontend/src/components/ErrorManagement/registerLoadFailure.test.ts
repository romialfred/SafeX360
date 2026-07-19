import { describe, expect, it } from 'vitest';
import { classifyRegisterLoadFailure } from './registerLoadFailure';

describe('classifyRegisterLoadFailure', () => {
    it('identifie un dépassement du délai Axios', () => {
        expect(classifyRegisterLoadFailure({ code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' }).kind).toBe(
            'timeout',
        );
    });

    it('distingue un refus d’accès d’une liste vide', () => {
        expect(classifyRegisterLoadFailure({ response: { status: 403 } }).kind).toBe('forbidden');
    });

    it('classe les autres pannes sans prétendre que le registre est vide', () => {
        const failure = classifyRegisterLoadFailure(new Error('network down'));
        expect(failure.kind).toBe('unavailable');
        expect(failure.message).toContain("Aucune donnée vide n'est déduite");
    });
});
