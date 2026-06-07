/**
 * dosimeter-assignment.spec.ts — Phase 10-B E2E (Module Dosimetrie).
 *
 * Scenario : flux complet inventaire -> assignation -> retour d'un dosimetre
 * a un travailleur expose.
 *
 * <p><b>Etapes</b> :
 *   1. Login PCR.
 *   2. Navigation /dosimetry/dosimeters (inventaire).
 *   3. Creation d'un dosimetre TLD AVAILABLE (numero de serie unique).
 *   4. Clic sur "Attribuer" -> ouverture du formulaire d'assignation.
 *   5. Selection d'un travailleur existant + date d'attribution -> submit.
 *   6. Verification : statut du dosimetre = ASSIGNED.
 *   7. Retour du dosimetre via le formulaire de restitution.
 *   8. Verification : statut = AVAILABLE puis IN_READING (selon flux).
 *
 * <p><b>RBAC</b> : DOSIMETRY_DOSIMETER_WRITE + DOSIMETRY_ASSIGN.
 */

import { test, expect } from '@playwright/test';
import { loginAsPcr, randomSerial, gotoDosimetry } from './fixtures';

test.describe('Dosimetrie — Assignation et restitution dosimetre', () => {
    test('cree, attribue puis restitue un dosimetre TLD', async ({ page }) => {
        const serial = randomSerial('TLD');
        const qrCode = `QR-${serial}`;

        // 1. Login PCR.
        await loginAsPcr(page);

        // 2. Inventaire.
        await gotoDosimetry(page, '/dosimeters');
        await expect(
            page.getByRole('heading', { name: /inventaire|inventory/i }).first(),
        ).toBeVisible({ timeout: 15000 });

        // 3. Creation dosimetre.
        await page
            .getByRole('button', { name: /nouveau.*dosim[èe]tre|new.*dosimeter|add/i })
            .first()
            .click();

        await page.getByLabel(/num[ée]ro.*s[ée]rie|serial.*number/i).fill(serial);
        await page.getByLabel(/qr.*code/i).fill(qrCode);

        // Selection type TLD.
        const typeSelect = page.getByLabel(/type/i).first();
        await typeSelect.click();
        await page.getByRole('option', { name: /^TLD$/i }).click();

        await page.getByRole('button', { name: /enregistrer|save|cr[ée]er/i }).click();
        await expect(
            page.getByText(/cr[ée][ée]?\s|created/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // Le dosimetre apparait en liste avec statut AVAILABLE.
        const row = page.getByRole('row', { name: new RegExp(serial) }).first();
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(row.getByText(/disponible|available/i)).toBeVisible();

        // 4. Attribution.
        await row.getByRole('button', { name: /attribuer|assign/i }).first().click();

        // 5. Selection worker + date.
        const workerSelect = page.getByLabel(/travailleur|worker|employee/i).first();
        await workerSelect.click();
        // Selectionne le premier worker propose (depend des seeds).
        await page.getByRole('option').first().click();

        const today = new Date().toISOString().slice(0, 10);
        await page.getByLabel(/date.*attribution|assignment.*date/i).first().fill(today);

        await page.getByRole('button', { name: /attribuer|confirm|valider/i }).first().click();

        // 6. Verification statut ASSIGNED.
        await expect(
            page.getByText(/attribu[ée]|assigned/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 7. Restitution.
        const assignedRow = page.getByRole('row', { name: new RegExp(serial) }).first();
        await assignedRow.getByRole('button', { name: /restituer|return/i }).click();
        await page.getByLabel(/date.*restitution|return.*date/i).first().fill(today);
        await page.getByRole('button', { name: /confirmer|valider|submit/i }).click();

        // 8. Verification statut AVAILABLE / IN_READING.
        await expect(
            page
                .getByRole('row', { name: new RegExp(serial) })
                .first()
                .getByText(/disponible|available|lecture|reading/i),
        ).toBeVisible({ timeout: 10000 });
    });
});
