/**
 * blast-confirm-triggers-jobs.spec.ts — P8 E2E (Module Blast Management).
 *
 * Scenario : la confirmation d'un tir (PLANNED -> CONFIRMED) declenche
 * automatiquement la creation des 5 jobs de notification :
 *   - EMAIL_24H        (T - 24h)
 *   - EMAIL_6H         (T -  6h)
 *   - EMAIL_30M        (T - 30 min)
 *   - POPUP_15M        (serie de popups toutes les 15 min, fenetre 120 min)
 *   - GENERAL_ALARM_10M (T - 10 min, declenche l'Alerte Generale)
 *
 * <p><b>Etapes</b> :
 *   1. Login en tant que Boutefeu.
 *   2. Navigation vers /blast/registry (registre).
 *   3. Recherche d'un tir en statut PLANNED (cree dans le seed BLT-2026-0143).
 *   4. Ouverture de sa fiche detail.
 *   5. Clic "Confirmer le tir" + saisie de la raison.
 *   6. Navigation vers l'onglet "Planification" / "Notifications".
 *   7. Verification : au moins 5 types de jobs (EMAIL_24H, EMAIL_6H, EMAIL_30M,
 *      POPUP_15M, GENERAL_ALARM_10M) apparaissent dans la table des jobs.
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec BLAST_CONFIRM.
 *
 * <p><b>Pre-requis seed</b> : seed_blast.py doit avoir cree BLT-2026-0143
 * en statut PLANNED.
 */

import { test, expect } from '@playwright/test';
import { loginAsBlastOfficer, gotoBlast } from './fixtures';

test.describe('Blast Management — Confirmation declenche 5 jobs de notification', () => {
    test('confirmer un tir cree 5 types de jobs (T-24h/6h/30min/popups/T-10)', async ({ page }) => {
        // 1. Login Boutefeu.
        await loginAsBlastOfficer(page);

        // 2. Registre des tirs.
        await gotoBlast(page, '/registry');
        await expect(
            page.getByRole('heading', { name: /registre.*tirs|blast.*registry/i }),
        ).toBeVisible({ timeout: 15000 });

        // 3. Rechercher BLT-2026-0143 (PLANNED, seede).
        const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('BLT-2026-0143');
        }

        // 4. Ouvrir la fiche detail (clic sur la reference).
        await page.getByText(/BLT-2026-0143/).first().click();

        // 5. Bouton "Confirmer le tir" + raison.
        await page
            .getByRole('button', { name: /confirmer.*tir|^confirm.*blast/i })
            .first()
            .click();

        const reasonInput = page.getByLabel(/raison|reason|motif/i).first();
        if (await reasonInput.isVisible({ timeout: 3000 })) {
            await reasonInput.fill('Confirmation E2E — verification creation jobs.');
            await page.getByRole('button', { name: /confirmer|valider|submit|ok/i }).first().click();
        }

        // Notification de succes
        await expect(
            page.getByText(/confirm[ée]|confirmed/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 6. Onglet "Planification" / "Jobs" / "Notifications".
        const planningTab = page
            .getByRole('tab', { name: /planification|notifications|rappels|jobs/i })
            .first();
        if (await planningTab.isVisible({ timeout: 3000 })) {
            await planningTab.click();
        }

        // 7. Verification : les 5 types de jobs sont presents.
        // On verifie chacun des types JobType definis cote backend.
        const expectedJobTypes = [
            /EMAIL_24H|J-1|24.*h/i,
            /EMAIL_6H|6\s*h/i,
            /EMAIL_30M|30\s*m/i,
            /POPUP_15M|popup|15\s*min/i,
            /GENERAL_ALARM_10M|alerte.*g[ée]n[ée]rale|T-10/i,
        ];

        for (const re of expectedJobTypes) {
            await expect(
                page.getByText(re).first(),
            ).toBeVisible({ timeout: 10000 });
        }
    });
});
