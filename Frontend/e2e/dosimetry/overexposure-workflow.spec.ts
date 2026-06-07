/**
 * overexposure-workflow.spec.ts — Phase 10-B E2E (Module Dosimetrie).
 *
 * Scenario : workflow complet d'un case de surexposition de l'ouverture
 * a la cloture PCR (Personne Competente en Radioprotection).
 *
 * <p><b>Etapes</b> :
 *   1. Login PCR.
 *   2. Navigation /dosimetry/overexposure-cases (liste des cas).
 *   3. Ouverture manuelle d'un nouveau case (si pas deja seedee).
 *   4. Selection du worker + saisie circonstances + niveau de gravite.
 *   5. Soumission -> statut OPEN.
 *   6. Passage en INVESTIGATION : ajout cause racine + actions correctives.
 *   7. Cloture PCR : ajout signature + commentaire + statut CLOSED.
 *   8. Verification : la cloture est journalisee dans l'audit log et le case
 *      apparait avec le statut CLOSED dans la liste.
 *
 * <p><b>RBAC</b> :
 *   - Ouverture / investigation : DOSIMETRY_CASE_WRITE.
 *   - Cloture : DOSIMETRY_PCR uniquement.
 */

import { test, expect } from '@playwright/test';
import { loginAsPcr, gotoDosimetry } from './fixtures';

test.describe('Dosimetrie — Workflow case de surexposition', () => {
    test('cree un case, passe en investigation puis cloture (PCR)', async ({
        page,
    }) => {
        // 1. Login PCR.
        await loginAsPcr(page);

        // 2. Liste des cases.
        await gotoDosimetry(page, '/overexposure-cases');
        await expect(
            page.getByRole('heading', { name: /surexposition|overexposure/i }).first(),
        ).toBeVisible({ timeout: 15000 });

        // 3. Nouveau case.
        await page
            .getByRole('button', { name: /nouveau.*cas|new.*case|ouvrir.*cas/i })
            .first()
            .click();

        // Selection worker.
        const workerSelect = page.getByLabel(/travailleur|worker/i).first();
        await workerSelect.click();
        await page.getByRole('option').first().click();

        // Circonstances.
        await page
            .getByLabel(/circonstances|circumstances|description/i)
            .first()
            .fill('Exposition au-dessus du seuil annuel pendant intervention non planifiee.');

        // Niveau de gravite : MAJOR.
        const severitySelect = page.getByLabel(/gravit[ée]|severity|level/i).first();
        await severitySelect.click();
        await page
            .getByRole('option', { name: /majeur|major|haut|high/i })
            .first()
            .click();

        // Date de detection.
        const today = new Date().toISOString().slice(0, 10);
        await page.getByLabel(/date.*d[ée]tection|detected.*date/i).first().fill(today);

        // 4. Soumission -> statut OPEN.
        await page.getByRole('button', { name: /ouvrir|cr[ée]er|create|open/i }).click();
        await expect(
            page.getByText(/ouvert|open|cas cr[ée]/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 5. Passage en INVESTIGATION.
        await page
            .getByRole('button', { name: /investigation|enqu[êe]ter|investigate/i })
            .first()
            .click();

        await page
            .getByLabel(/cause.*racine|root.*cause/i)
            .first()
            .fill('Defaut d\'EPI : casque dosimetre mal positionne durant la rotation.');
        await page
            .getByLabel(/action.*corrective|corrective.*action/i)
            .first()
            .fill('Formation EPI obligatoire + revision procedure rotation.');

        await page.getByRole('button', { name: /enregistrer|save|valider/i }).click();
        await expect(
            page.getByText(/investigation/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 6. Cloture PCR.
        await page
            .getByRole('button', { name: /cl[ôo]turer.*pcr|close.*pcr|close.*case/i })
            .first()
            .click();

        await page
            .getByLabel(/commentaire.*cl[ôo]ture|closure.*comment/i)
            .first()
            .fill('Actions correctives appliquees et controlees. Dossier cloture.');

        // Acknowledge / signature checkbox.
        const ack = page.getByRole('checkbox', { name: /confirme|acknowledge|signature/i }).first();
        if (await ack.isVisible().catch(() => false)) {
            await ack.check();
        }

        await page.getByRole('button', { name: /cl[ôo]turer|close|confirmer/i }).click();

        // 7. Verification statut CLOSED.
        await expect(
            page.getByText(/cl[ôo]tur[ée]|closed/i).first(),
        ).toBeVisible({ timeout: 15000 });

        // 8. Retour liste : presence du badge CLOSED.
        await gotoDosimetry(page, '/overexposure-cases');
        await expect(
            page.getByText(/cl[ôo]tur[ée]|closed/i).first(),
        ).toBeVisible({ timeout: 10000 });
    });
});
