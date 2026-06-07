/**
 * dose-entry-and-alert.spec.ts — Phase 10-B E2E (Module Dosimetrie).
 *
 * Scenario : saisie d'une dose individuelle Hp(10) au-dessus du seuil
 * reglementaire (22 mSv > limite annuelle 20 mSv pour categorie A) et
 * verification de l'alerte EXCEEDED + ouverture automatique d'un case
 * de surexposition.
 *
 * <p><b>Etapes</b> :
 *   1. Login PCR.
 *   2. Navigation /dosimetry/dose-tracking (suivi des doses).
 *   3. Ouverture du formulaire de saisie dose.
 *   4. Selection d'un travailleur expose existant.
 *   5. Saisie Hp(10) = 22 mSv, periode = mois courant.
 *   6. Submit -> verification de l'alerte EXCEEDED dans le banner d'alertes.
 *   7. Verification : le case de surexposition a ete ouvert automatiquement
 *      (navigation vers /dosimetry/overexposure-cases puis check de la ligne).
 *
 * <p><b>RBAC</b> : DOSIMETRY_DOSE_WRITE.
 *
 * <p><b>Note</b> : ce test consomme un slot d'overexposure case. En CI, il
 * faut un script de cleanup post-suite pour eviter d'empiler les cases
 * pollue par les runs precedents.
 */

import { test, expect } from '@playwright/test';
import { loginAsPcr, gotoDosimetry } from './fixtures';

test.describe('Dosimetrie — Saisie dose + alerte EXCEEDED', () => {
    test('saisit Hp(10) = 22 mSv et declenche un case de surexposition', async ({
        page,
    }) => {
        // 1. Login PCR.
        await loginAsPcr(page);

        // 2. Suivi des doses.
        await gotoDosimetry(page, '/dose-tracking');
        await expect(
            page.getByRole('heading', { name: /suivi.*doses|dose.*tracking/i }).first(),
        ).toBeVisible({ timeout: 15000 });

        // 3. Ouverture du formulaire dose.
        await page
            .getByRole('button', { name: /saisir.*dose|new.*dose|nouvelle.*dose/i })
            .first()
            .click();

        // 4. Selection worker.
        const workerSelect = page.getByLabel(/travailleur|worker|employee/i).first();
        await workerSelect.click();
        await page.getByRole('option').first().click();

        // 5. Saisie Hp(10) = 22 mSv.
        await page.getByLabel(/hp\s*\(10\)|effective.*dose|hp10/i).first().fill('22');

        // Periode : mois courant (premier jour).
        const now = new Date();
        const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        await page.getByLabel(/d[ée]but.*p[ée]riode|period.*start/i).first().fill(periodStart);

        const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        ).padStart(2, '0')}`;
        await page.getByLabel(/fin.*p[ée]riode|period.*end/i).first().fill(periodEnd);

        // 6. Submit.
        await page.getByRole('button', { name: /enregistrer|save|submit/i }).click();

        // Confirmation enregistrement.
        await expect(
            page.getByText(/enregistr[ée]|saved/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // Alerte EXCEEDED visible (banner ou notification).
        await expect(
            page.getByText(/d[ée]passement|exceeded|surexposition/i).first(),
        ).toBeVisible({ timeout: 15000 });

        // 7. Verification ouverture automatique du case.
        await gotoDosimetry(page, '/overexposure-cases');
        await expect(
            page.getByRole('heading', { name: /surexposition|overexposure/i }).first(),
        ).toBeVisible({ timeout: 15000 });

        // Au moins une ligne avec statut OPEN / OUVERT existe.
        await expect(
            page.getByText(/ouvert|open|investigation/i).first(),
        ).toBeVisible({ timeout: 10000 });
    });
});
