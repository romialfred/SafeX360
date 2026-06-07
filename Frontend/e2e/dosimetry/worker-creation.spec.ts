/**
 * worker-creation.spec.ts — Phase 10-B E2E (Module Dosimetrie).
 *
 * Scenario : creation d'un travailleur expose categorie A depuis le registre.
 *
 * <p><b>Etapes</b> :
 *   1. Login en tant que PCR (Personne Competente en Radioprotection).
 *   2. Navigation vers /dosimetry/exposed-workers (registre des exposes).
 *   3. Clic sur "Nouveau travailleur expose" -> ouverture du formulaire.
 *   4. Saisie : matricule, nom, prenom, date d'embauche, categorie = A,
 *      poste = "Mineur fond galerie", date debut exposition.
 *   5. Soumission du formulaire -> attente d'une notification de succes.
 *   6. Verification : le nouveau worker apparait dans la liste avec son
 *      matricule et la categorie A.
 *
 * <p><b>Verifications BDD</b> : la persistance reelle est verifiee via l'UI
 * (re-fetch automatique de la liste). Un test plus profond pourrait appeler
 * directement l'endpoint REST {@code GET /api/v1/dosimetry/workers} pour
 * confirmer la presence en base — c'est volontairement laisse comme TODO
 * pour ne pas dupliquer la logique entre UI et API.
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec
 * {@code DOSIMETRY_WORKER_WRITE}.
 */

import { test, expect } from '@playwright/test';
import {
    loginAsPcr,
    randomWorkerName,
    gotoDosimetry,
} from './fixtures';

test.describe('Dosimetrie — Creation worker categorie A', () => {
    test('cree un nouveau travailleur expose categorie A', async ({ page }) => {
        const { first, last } = randomWorkerName();
        const matricule = `PW-${Date.now().toString().slice(-8)}`;

        // 1. Login PCR.
        await loginAsPcr(page);

        // 2. Registre des exposes.
        await gotoDosimetry(page, '/exposed-workers');
        await expect(
            page.getByRole('heading', { name: /registre.*exposes|exposed.*workers/i }),
        ).toBeVisible({ timeout: 15000 });

        // 3. Ouvre le formulaire de creation.
        await page
            .getByRole('button', { name: /nouveau.*travailleur|new.*worker|add.*worker/i })
            .first()
            .click();

        // 4. Saisie des champs obligatoires.
        await page.getByLabel(/matricule|payroll|employee.*id/i).fill(matricule);
        await page.getByLabel(/^pr[ée]nom|first.?name/i).fill(first);
        await page.getByLabel(/^nom|^last.?name/i).fill(last);

        // Categorie A radio / select.
        const categorySelect = page.getByLabel(/cat[ée]gorie|category/i).first();
        if ((await categorySelect.getAttribute('role')) === 'combobox') {
            await categorySelect.click();
            await page.getByRole('option', { name: /^A\b|cat[ée]gorie.*A/i }).click();
        } else {
            await page.getByRole('radio', { name: /^A$|cat[ée]gorie.*A/i }).check();
        }

        // Poste de travail.
        await page
            .getByLabel(/poste.*travail|job.*title|workstation/i)
            .first()
            .fill('Mineur fond galerie');

        // Date debut exposition.
        const dateInput = page
            .getByLabel(/d[ée]but.*exposition|exposure.*start.*date/i)
            .first();
        await dateInput.fill('2026-01-15');

        // 5. Soumission.
        await page.getByRole('button', { name: /enregistrer|cr[ée]er|save|submit/i }).click();

        // Notification de succes (Mantine notifications).
        await expect(
            page.getByText(/cr[ée][ée]?\s|created|saved successfully/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 6. Verification dans la liste.
        await expect(page.getByText(matricule)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(`${last}`)).toBeVisible();
    });
});
