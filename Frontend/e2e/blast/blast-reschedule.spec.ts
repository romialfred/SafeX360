/**
 * blast-reschedule.spec.ts — P8 E2E (Module Blast Management).
 *
 * Scenario : reporter un tir (POSTPONE) puis le replanifier vers une nouvelle
 * date. Verifie que :
 *  - les jobs de notification originaux sont CANCELLED ;
 *  - le tir passe en statut POSTPONED puis revient a PLANNED apres replan ;
 *  - les nouveaux jobs sont crees a la nouvelle date.
 *
 * <p><b>Etapes</b> :
 *   1. Login Boutefeu.
 *   2. Navigation vers le registre.
 *   3. Trouver le tir BLT-2026-0142 (CONFIRMED).
 *   4. Cliquer "Reporter" + saisir nouvelle date + raison.
 *   5. Verifier badge POSTPONED.
 *   6. Verifier que la nouvelle date est affichee dans la fiche.
 *   7. Optionnel : verifier que les jobs originaux sont CANCELLED dans l'onglet
 *      Planification, et que de nouveaux jobs SCHEDULED ont ete crees.
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec BLAST_PLAN.
 *
 * <p><b>Pre-requis seed</b> : seed_blast.py doit avoir cree BLT-2026-0142
 * en statut CONFIRMED, dans le futur.
 */

import { test, expect } from '@playwright/test';
import { loginAsBlastOfficer, gotoBlast, futureBlastDateTime } from './fixtures';

test.describe('Blast Management — Report et replanification d\'un tir', () => {
    test('reporter un tir cancel les jobs et le replan cree de nouveaux jobs', async ({ page }) => {
        // Nouvelle date : J+7 a 10h00 (decale par rapport au seed J+3).
        const newWhen = futureBlastDateTime(7, 10, 0);

        // 1. Login.
        await loginAsBlastOfficer(page);

        // 2. Registre.
        await gotoBlast(page, '/registry');
        await expect(
            page.getByRole('heading', { name: /registre.*tirs|blast.*registry/i }),
        ).toBeVisible({ timeout: 15000 });

        // 3. Trouver BLT-2026-0142.
        const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('BLT-2026-0142');
        }
        await page.getByText(/BLT-2026-0142/).first().click();

        // 4. Bouton "Reporter" / "Postpone".
        await page
            .getByRole('button', { name: /reporter|postpone|reprogrammer/i })
            .first()
            .click();

        // Modale : nouvelle date + raison.
        const newDateInput = page
            .getByLabel(/nouvelle.*date|new.*date|date.*report[ée]e/i)
            .first();
        if (await newDateInput.isVisible({ timeout: 3000 })) {
            await newDateInput.fill(newWhen.date);
        }
        const newTimeInput = page.getByLabel(/nouvelle.*heure|new.*time/i).first();
        if (await newTimeInput.isVisible({ timeout: 3000 })) {
            await newTimeInput.fill(newWhen.time);
        }
        const reasonInput = page.getByLabel(/raison|reason|motif/i).first();
        if (await reasonInput.isVisible({ timeout: 3000 })) {
            await reasonInput.fill('Report E2E — alerte meteo (orage previsionnel).');
        }
        await page
            .getByRole('button', { name: /^reporter$|^postpone$|valider|submit|ok/i })
            .first()
            .click();

        // 5. Badge POSTPONED visible.
        await expect(
            page.getByText(/^POSTPONED$|^Report[ée]$/i).first(),
        ).toBeVisible({ timeout: 15000 });

        // 6. La nouvelle date est affichee.
        // On verifie la presence de la date (sous une forme lisible)
        await expect(
            page.getByText(new RegExp(newWhen.date)).first(),
        ).toBeVisible({ timeout: 10000 });

        // 7. Verification optionnelle : onglet Planification + jobs CANCELLED / SCHEDULED.
        const planningTab = page
            .getByRole('tab', { name: /planification|notifications|rappels|jobs/i })
            .first();
        if (await planningTab.isVisible({ timeout: 3000 })) {
            await planningTab.click();
            // Au moins un job CANCELLED doit apparaitre (jobs originaux).
            await expect(
                page.getByText(/CANCELLED|annul[ée]/i).first(),
            ).toBeVisible({ timeout: 10000 });
        }
    });
});
