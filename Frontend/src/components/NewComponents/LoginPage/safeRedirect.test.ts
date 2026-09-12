import { describe, expect, it } from 'vitest';
import { DEFAULT_REDIRECT, resolveRedirect, sanitizeRedirect } from './safeRedirect';

describe('destination post-connexion', () => {
    it('accepte un chemin interne', () => {
        expect(sanitizeRedirect('/ppe-monitoring')).toBe('/ppe-monitoring');
        expect(sanitizeRedirect('/incidents?mine=3')).toBe('/incidents?mine=3');
    });

    it('refuse toute destination externe', () => {
        // Le « // » en tête est une URL protocol-relative : le navigateur
        // sortirait du domaine SafeX sans que rien ne le signale.
        expect(sanitizeRedirect('//evil.example')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('/\\evil.example')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('https://evil.example')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse de renvoyer sur les écrans d’authentification', () => {
        expect(sanitizeRedirect('/login')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('/forget-password')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('/first-login')).toBe(DEFAULT_REDIRECT);
    });

    it('refuse les valeurs vides, non textuelles ou porteuses de caractères de contrôle', () => {
        expect(sanitizeRedirect(undefined)).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('')).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect({ pathname: '/x' })).toBe(DEFAULT_REDIRECT);
        expect(sanitizeRedirect('/audits\nSet-Cookie: a=b')).toBe(DEFAULT_REDIRECT);
    });

    it('privilégie l’état de navigation, puis le paramètre next', () => {
        expect(resolveRedirect({ from: { pathname: '/audits', search: '?tab=1' } }, ''))
            .toBe('/audits?tab=1');
        expect(resolveRedirect(null, '?next=%2Frisks')).toBe('/risks');
        expect(resolveRedirect(null, '?next=https%3A%2F%2Fevil.example')).toBe(DEFAULT_REDIRECT);
        expect(resolveRedirect(null, '')).toBe(DEFAULT_REDIRECT);
    });
});
