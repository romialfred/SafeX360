/**
 * blast-misfire-blocks-allclear.spec.ts — P8 E2E (Module Blast Management).
 *
 * Scenario : declarer un rate (MISFIRE) sur un tir tire (FIRED) et verifier
 * que le bouton "Site degage" (ALL_CLEAR) est desactive tant que la resolution
 * du rate n'est pas explicitement saisie.
 *
 * <p><b>Regle metier critique</b> : un tir en statut MISFIRE NE PEUT PAS
 * passer en ALL_CLEAR avant d'avoir ete explicitement resolu (via l'endpoint
 * {@code resolveMisfire}, qui setse {@code misfireResolvedAt}). C'est une
 * garde de securite reglementaire (un rate non-resolu = explosifs en place,
 * la zone est interdite).
 *
 * <p><b>Etapes</b> :
 *   1. Login Boutefeu.
 *   2. Creer un tir factice ou utiliser un tir existant en statut FIRED.
 *      (Pour ce test E2E, on suppose un tir BLT-2026-0144 confirme et
 *       transitionne manuellement IMMINENT -> FIRED via boutons UI.)
 *   3. Cliquer "Declarer un rate" / "Misfire".
 *   4. Saisir le protocole d'intervention.
 *   5. Verifier badge MISFIRE.
 *   6. Verifier que le bouton "Site degage" / "All Clear" est DISABLED.
 *   7. Cliquer "Resoudre le rate" + saisir les notes de resolution.
 *   8. Verifier que "Site degage" devient ACTIF.
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec BLAST_CONFIRM et
 * BLAST_ADMIN (pour la resolution de misfire).
 */

import { test, expect } from '@playwright/test';
import { loginAsBlastOfficer, gotoBlast } from './fixtures';

test.describe('Blast Management — Un rate bloque la transition vers ALL_CLEAR', () => {
    test('declarer un misfire desactive le bouton all-clear jusqu\'a resolution', async ({ page }) => {
        // 1. Login.
        await loginAsBlastOfficer(page);

        // 2. Aller dans le registre et ouvrir un tir en cours (utilise BLT-2026-0144).
        await gotoBlast(page, '/registry');
        await expect(
            page.getByRole('heading', { name: /registre.*tirs|blast.*registry/i }),
        ).toBeVisible({ timeout: 15000 });

        const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('BLT-2026-0144');
        }
        await page.getByText(/BLT-2026-0144/).first().click();

        // 3. Transitionner CONFIRMED -> IMMINENT -> FIRED (boutons UI).
        // Note : selon l'implementation, ces transitions peuvent etre automatiques
        // (scheduler) ou manuelles (boutons "Marquer imminent" / "Marquer tire").
        const imminentBtn = page
            .getByRole('button', { name: /imminent|marquer.*imminent/i })
            .first();
        if (await imminentBtn.isVisible({ timeout: 3000 })) {
            await imminentBtn.click();
            const reason1 = page.getByLabel(/raison|reason/i).first();
            if (await reason1.isVisible({ timeout: 2000 })) {
                await reason1.fill('Passage imminent E2E.');
                await page.getByRole('button', { name: /valider|submit|ok/i }).first().click();
            }
        }

        const firedBtn = page
            .getByRole('button', { name: /^marquer.*tir[ée]$|^fire[d]?$|tir.*ex[ée]cut[ée]/i })
            .first();
        if (await firedBtn.isVisible({ timeout: 3000 })) {
            await firedBtn.click();
            const reason2 = page.getByLabel(/raison|reason/i).first();
            if (await reason2.isVisible({ timeout: 2000 })) {
                await reason2.fill('Tir execute E2E.');
                await page.getByRole('button', { name: /valider|submit|ok/i }).first().click();
            }
        }

        // 4. Declarer un misfire.
        const misfireBtn = page
            .getByRole('button', { name: /d[ée]clarer.*rat[ée]|misfire|rat[ée]/i })
            .first();
        await misfireBtn.click();

        const misfireReason = page.getByLabel(/raison|reason|d[ée]tail/i).first();
        if (await misfireReason.isVisible({ timeout: 3000 })) {
            await misfireReason.fill(
                'Trou n° 17 non-detone — detonateur defaillant identifie visuellement.',
            );
            await page.getByRole('button', { name: /d[ée]clarer|valider|submit|ok/i }).first().click();
        }

        // 5. Badge MISFIRE.
        await expect(
            page.getByText(/^MISFIRE$|^Rat[ée]$/i).first(),
        ).toBeVisible({ timeout: 15000 });

        // 6. Le bouton ALL_CLEAR doit etre DISABLED ou absent.
        const allClearBtn = page
            .getByRole('button', { name: /site.*d[ée]gag[ée]|all.*clear/i })
            .first();
        if (await allClearBtn.isVisible({ timeout: 3000 })) {
            await expect(allClearBtn).toBeDisabled();
        } else {
            // Si le bouton est totalement masque (pattern alternatif), on verifie
            // qu'un message d'avertissement de blocage est visible.
            await expect(
                page.getByText(/rat[ée].*non.*r[ée]solu|misfire.*not.*resolved|r[ée]solution.*requise/i).first(),
            ).toBeVisible({ timeout: 5000 });
        }

        // 7. Resoudre le rate (BLAST_ADMIN).
        const resolveBtn = page
            .getByRole('button', { name: /r[ée]soudre.*rat[ée]|resolve.*misfire/i })
            .first();
        if (await resolveBtn.isVisible({ timeout: 3000 })) {
            await resolveBtn.click();
            const resolutionNotes = page.getByLabel(/notes.*r[ée]solution|resolution.*notes/i).first();
            if (await resolutionNotes.isVisible({ timeout: 3000 })) {
                await resolutionNotes.fill(
                    'Trou re-amorce avec detonateur de secours, contre-mine controlee, zone declaree saine.',
                );
                await page.getByRole('button', { name: /r[ée]soudre|valider|submit|ok/i }).first().click();
            }

            // 8. Apres resolution, le bouton ALL_CLEAR devient ACTIF.
            await expect(
                page
                    .getByRole('button', { name: /site.*d[ée]gag[ée]|all.*clear/i })
                    .first(),
            ).toBeEnabled({ timeout: 10000 });
        }
    });
});
