/**
 * AUD-GOV-001 — garde-fou des allégations diffusées sans authentification.
 *
 * La règle porte sur les canaux publics (vitrine, connexion et métadonnées),
 * pas sur les références normatives nécessaires aux workflows authentifiés.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LandingPage from '../../components/NewComponents/LandingPage/LandingPage';

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ user: null }),
}));

const FORBIDDEN_PUBLIC_CLAIMS: RegExp[] = [
    /conforme(?:s)?\s+(?:aux?\s+)?(?:normes?\s+)?iso/i,
    /iso\s*\d{4,5}[^\n]{0,30}\bcertifi(?:é|ée|és|ées|ed)\b/i,
    /\baudits?\s+iso\s+certifi(?:é|ée|és|ées|ed)\b/i,
    /\bpremière mondiale\b/i,
    /\bconformité native\b/i,
    /\bsupport\s+24\s*\/\s*7\b/i,
    /\bhébergement souverain\b/i,
    /\bsouverain\s*·\s*hébergé en afrique\b/i,
    /\btemps de réponse sos\b[^\n]{0,20}\b200\s*ms\b/i,
    /\bprécision détection epi\b/i,
    /\b98[.,]7\s*%/i,
    /\b(?:−|-)\s*(?:42|45|67|87)\s*%/i,
    /\bmesur(?:é|ée|és|ées) sur 6 sites\b/i,
    /\bdonnées réelles\b[^\n]{0,50}\baudit(?:é|ée|és|ées)s?\b/i,
    /\bconforme aux codes miniers africains\b/i,
    /\bbenchmarks? réels?\b/i,
    /\bvies préservées\b/i,
    /\baccidents évités\b/i,
    /\bretour sur investissement annuel\b/i,
    /\bnet gain annuel\b/i,
    /\béconomiserait\b/i,
];

function expectNoUnsupportedPublicClaim(content: string): void {
    for (const forbidden of FORBIDDEN_PUBLIC_CLAIMS) {
        expect(content, `Allégation publique interdite détectée : ${forbidden}`).not.toMatch(forbidden);
    }
}

beforeAll(() => {
    class NoopIntersectionObserver implements IntersectionObserver {
        readonly root = null;
        readonly rootMargin = '0px';
        readonly thresholds = [0];

        disconnect(): void {}
        observe(): void {}
        takeRecords(): IntersectionObserverEntry[] { return []; }
        unobserve(): void {}
    }

    vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);
});

afterEach(() => cleanup());

describe('AUD-GOV-001 — canaux publics SafeX', () => {
    it('n’affiche aucune certification, conformité ou performance non démontrée sur la vitrine', () => {
        const { container } = render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        );

        const publicText = container.textContent ?? '';
        expectNoUnsupportedPublicClaim(publicText);
        expect(publicText).toMatch(/conçu(?:e)?s? pour soutenir/i);
        expect(publicText).toContain('ISO 45001');
    });

    it('protège les métadonnées web et mobile', () => {
        const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
        const manifest = readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8');

        expectNoUnsupportedPublicClaim(`${indexHtml}\n${manifest}`);
        expect(indexHtml).toMatch(/conçue pour soutenir/i);
    });

    it('scanne aussi les sources des canaux publics pour empêcher la réactivation d’un ancien contenu', () => {
        const publicSources = [
            'src/components/NewComponents/LandingPage/LandingPage.tsx',
            'src/components/NewComponents/LoginPage/LoginsPage.tsx',
            'src/components/NewComponents/LoginPage/PasswordPage.tsx',
            'src/components/UtilityComp/IsoBadge.tsx',
            'index.html',
            'public/manifest.webmanifest',
        ].map((path) => readFileSync(resolve(process.cwd(), path), 'utf8')).join('\n');

        expectNoUnsupportedPublicClaim(publicSources);
        expect(publicSources).not.toMatch(/<ROICalculator(?:\s|\/|>)/);
    });

    it('autorise les références normatives factuelles dans le produit authentifié', () => {
        const aboutPage = readFileSync(resolve(process.cwd(), 'src/pages/dashboard/AboutPage.tsx'), 'utf8');

        expect(aboutPage).toContain("code: 'ISO 45001'");
        expect(aboutPage).toContain("code: 'ISO 19011'");
        expect(aboutPage).toContain('Référentiels pris en compte');
    });
});
