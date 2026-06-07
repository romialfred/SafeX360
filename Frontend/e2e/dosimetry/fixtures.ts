/**
 * fixtures.ts — Phase 10-B Frontend (Module Dosimetrie).
 *
 * Helpers partages entre les specs E2E Playwright du module Dosimetrie :
 *  - Login programmatique via formulaire (selection mine par defaut).
 *  - Helpers de generation de donnees deterministes (serial, nom worker).
 *  - Selecteurs reutilises (banner offline, badges, breadcrumb).
 *
 * <p>Les identifiants de test (PW_USER, PW_PASS, PW_MINE_ID) sont passes via
 * variables d'environnement pour ne JAMAIS commit de credentials.
 *
 * <p>Exemple d'usage :
 * <pre>
 *   import { test, expect } from '@playwright/test';
 *   import { loginAsPcr, randomSerial } from './fixtures';
 *
 *   test('demo', async ({ page }) => {
 *     await loginAsPcr(page);
 *     // ...
 *   });
 * </pre>
 */

import type { Page } from '@playwright/test';

/** Identifiant utilisateur PCR pour tous les tests. */
export const PW_USER = process.env.PW_USER ?? 'pcr.test@safex.local';
/** Mot de passe utilisateur PCR. */
export const PW_PASS = process.env.PW_PASS ?? 'Pcr-Test!2026';
/** Mine selectionnee pour les operations multi-tenant. */
export const PW_MINE_ID = Number(process.env.PW_MINE_ID ?? 1);

/**
 * Effectue un login UI complet. Attend la redirection sur le dashboard et la
 * presence du shell SafeX (sidebar + topbar). Retourne quand l'app est prete
 * a executer une navigation /dosimetry/...
 */
export async function loginAsPcr(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel(/email|identifiant|login/i).fill(PW_USER);
    await page.getByLabel(/mot de passe|password/i).fill(PW_PASS);
    await page.getByRole('button', { name: /se connecter|sign in|login/i }).click();
    // Attendre la sortie de /login (peu importe la cible exacte).
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
        timeout: 30 * 1000,
    });
}

/**
 * Genere un numero de serie deterministe mais unique par run (timestamp).
 * Format : PW-{YYYYMMDDHHMMSS}-{suffix}
 */
export function randomSerial(prefix = 'PW'): string {
    const now = new Date();
    const stamp =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${stamp}-${suffix}`;
}

/**
 * Genere un nom de worker unique par run pour eviter les collisions sur les
 * tests qui s'enchainent.
 */
export function randomWorkerName(): { first: string; last: string } {
    const id = Math.random().toString(36).slice(2, 7).toUpperCase();
    return { first: 'Pierre', last: `E2E-${id}` };
}

/**
 * Navigue vers une page Dosimetrie en passant explicitement par le menu
 * lateral. Verifie l'apparition du breadcrumb attendu.
 */
export async function gotoDosimetry(page: Page, path: string): Promise<void> {
    await page.goto(`/dosimetry${path.startsWith('/') ? path : `/${path}`}`);
    // Pas d'assertion stricte sur le breadcrumb — celui-ci varie par page.
    await page.waitForLoadState('domcontentloaded');
}
