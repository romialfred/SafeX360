/**
 * fixtures.ts — P8 E2E (Module Blast Management).
 *
 * Helpers partages entre les specs E2E Playwright du module Blast Management :
 *  - Login programmatique via formulaire (rôle Boutefeu / Blast Officer par defaut).
 *  - Helpers de generation de donnees deterministes (reference de tir, horodatages).
 *  - Selecteurs reutilises (badges status, modales raison, notifications).
 *
 * <p>Les identifiants de test (PW_BLAST_USER, PW_BLAST_PASS, PW_MINE_ID) sont
 * passes via variables d'environnement pour ne JAMAIS commit de credentials.
 *
 * <p>Exemple d'usage :
 * <pre>
 *   import { test, expect } from '@playwright/test';
 *   import { loginAsBlastOfficer, randomBlastReference } from './fixtures';
 *
 *   test('demo', async ({ page }) => {
 *     await loginAsBlastOfficer(page);
 *     // ...
 *   });
 * </pre>
 */

import type { Page } from '@playwright/test';

/** Identifiant utilisateur Boutefeu pour tous les tests. */
export const PW_BLAST_USER = process.env.PW_BLAST_USER ?? 'boutefeu.test@safex.local';
/** Mot de passe utilisateur Boutefeu — OBLIGATOIREMENT via variable
 *  d'environnement : aucun mot de passe par défaut ne doit vivre dans un
 *  dépôt public. */
export const PW_BLAST_PASS = process.env.PW_BLAST_PASS ?? (() => {
    throw new Error('PW_BLAST_PASS non défini — exportez la variable d\'environnement avant de lancer les tests e2e.');
})();
/** Mine selectionnee pour les operations multi-tenant. */
export const PW_MINE_ID = Number(process.env.PW_MINE_ID ?? 1);

/**
 * Effectue un login UI complet en tant que Boutefeu. Attend la redirection
 * hors de /login et la presence du shell SafeX (sidebar + topbar).
 */
export async function loginAsBlastOfficer(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel(/email|identifiant|login/i).fill(PW_BLAST_USER);
    await page.getByLabel(/mot de passe|password/i).fill(PW_BLAST_PASS);
    await page.getByRole('button', { name: /se connecter|sign in|login/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
        timeout: 30 * 1000,
    });
}

/**
 * Genere une reference de tir deterministe mais unique par run.
 * Format : BLT-{YYYY}-PW{timestamp_suffix}
 */
export function randomBlastReference(): string {
    const year = new Date().getFullYear();
    const ts = Date.now().toString().slice(-6);
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `BLT-${year}-PW${ts}${suffix}`;
}

/**
 * Date de tir programmable dans le futur, format ISO local (sans Z).
 * Par defaut : J+3 a 14h00, pour laisser de la marge T-24h/T-6h/T-30min.
 */
export function futureBlastDateTime(daysAhead = 3, hour = 14, minute = 0): {
    iso: string;
    date: string;
    time: string;
} {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { iso: `${date}T${time}`, date, time };
}

/**
 * Navigue vers une page Blast en passant par l'URL directe. Verifie le
 * chargement de l'app (domcontentloaded suffit, pas d'assertion stricte sur
 * le breadcrumb qui varie d'une page a l'autre).
 */
export async function gotoBlast(page: Page, path: string): Promise<void> {
    await page.goto(`/blast${path.startsWith('/') ? path : `/${path}`}`);
    await page.waitForLoadState('domcontentloaded');
}
