import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou anti-régression — « Salle de Crise inaccessible par intermittence ».
 *
 * Symptôme : « a redirected response was used for a request whose redirect mode
 * is not "follow" » → ERR_FAILED, réparé par un Ctrl+Maj+R (qui court-circuite
 * le Service Worker). Deux fois en trois semaines, par deux chemins différents.
 *
 * MÉCANISME. La `NavigationRoute` du Service Worker est liée à l'URL de repli.
 * Précache présent → servi depuis le cache, tout va bien. Précache ABSENT
 * (fenêtre suivant un déploiement, éviction de stockage) → Workbox se rabat sur
 * un `fetch()` de cette URL. Si l'hébergeur la redirige, la réponse porte
 * `redirected = true` — interdit pour une navigation.
 *
 * `cleanUrls: true` (vercel.json) redirige justement toute URL en `.html` :
 * `/index.html` répond 308 vers `/`. L'URL de repli ne doit donc JAMAIS se
 * terminer par `.html` tant que `cleanUrls` est actif. C'est cet accord entre
 * deux fichiers que ce test verrouille — il ne peut pas se relire dans un seul.
 *
 * Seule la Salle de Crise déclenchait le défaut : c'est le seul écran ouvert par
 * `window.open`, donc la seule VRAIE navigation. Partout ailleurs le routage est
 * côté client et ne passe pas par la NavigationRoute. Un défaut de navigation
 * peut donc n'affecter qu'un écran sur toute la plateforme : ne jamais conclure
 * d'un écran sain que le repli est correct.
 */

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

const viteConfig = read('vite.config.ts');
const vercelConfig = JSON.parse(read('vercel.json')) as { cleanUrls?: boolean };

/** Extrait la valeur littérale de `navigateFallback` de la config Vite. */
const navigateFallback = (): string => {
    const m = viteConfig.match(/navigateFallback:\s*'([^']+)'/);
    expect(m, 'vite.config.ts doit déclarer un navigateFallback').not.toBeNull();
    return (m as RegExpMatchArray)[1];
};

describe('repli de navigation du Service Worker', () => {
    it("ne pointe pas sur une URL que l'hébergeur redirigerait", () => {
        const fallback = navigateFallback();
        if (vercelConfig.cleanUrls) {
            // Avec cleanUrls, toute URL en .html est redirigée (308) : la servir
            // en repli de navigation casse l'ouverture en nouvel onglet.
            expect(
                fallback.endsWith('.html'),
                `navigateFallback vaut « ${fallback} » : avec cleanUrls, cette URL est redirigée `
                + 'et provoque ERR_FAILED sur les navigations servies par le Service Worker.',
            ).toBe(false);
        }
        expect(fallback).toBe('/');
    });

    it('précache bien l’URL utilisée comme repli, sinon le cache ne sert jamais', () => {
        // `createHandlerBoundToURL(x)` ne sait servir depuis le cache que si `x`
        // est une entrée de précache. Sans la réécriture, l'entrée s'appelle
        // « index.html » et le repli sur « / » retomberait TOUJOURS sur le réseau.
        expect(viteConfig).toContain('manifestTransforms');
        expect(viteConfig).toMatch(/entry\.url === 'index\.html'\s*\?\s*\{\s*\.\.\.entry,\s*url:\s*'\/'/);
    });

    it('laisse les routes API hors du repli de navigation', () => {
        // Une réponse d'API remplacée par l'app shell est indétectable côté client.
        for (const route of ['/api', '/hns', '/hrms', '/safex-analytics']) {
            expect(viteConfig).toContain(route);
        }
    });
});
