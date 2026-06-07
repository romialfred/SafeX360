/**
 * pdf-generation.spec.ts — Phase 10-B E2E (Module Dosimetrie).
 *
 * Scenario : generation et download d'une attestation individuelle PDF
 * (preuve reglementaire opposable transmise au travailleur expose).
 *
 * <p><b>Etapes</b> :
 *   1. Login PCR.
 *   2. Navigation /dosimetry/reports (centre de rapports).
 *   3. Selection du type "Attestation individuelle d'exposition".
 *   4. Selection du worker + de l'annee concernee.
 *   5. Saisie de la raison RGPD (justification obligatoire pour generation).
 *   6. Clic sur "Generer" -> attente du download du PDF.
 *   7. Verification :
 *      - le fichier telecharge a une extension .pdf,
 *      - sa taille est > 1 KB (sanity check),
 *      - une entree d'audit a ete creee (visible dans le journal d'export).
 *
 * <p><b>RBAC</b> : DOSIMETRY_REPORT_READ (lecture rapport individuel).
 *
 * <p><b>Note</b> : Playwright capture le download via {@code page.waitForEvent('download')}.
 * Le fichier est sauvegarde dans un repertoire temp et compare a un minimum
 * de taille pour valider que le PDF n'est pas vide / corrompu.
 */

import { test, expect } from '@playwright/test';
import { loginAsPcr, gotoDosimetry } from './fixtures';
import { promises as fs } from 'node:fs';

test.describe('Dosimetrie — Generation PDF attestation individuelle', () => {
    test('genere et telecharge une attestation individuelle PDF', async ({
        page,
    }) => {
        // 1. Login PCR.
        await loginAsPcr(page);

        // 2. Centre de rapports.
        await gotoDosimetry(page, '/reports');
        await expect(
            page.getByRole('heading', { name: /rapports|reports/i }).first(),
        ).toBeVisible({ timeout: 15000 });

        // 3. Selection du type de rapport.
        await page
            .getByRole('button', {
                name: /attestation.*individuelle|individual.*certificate/i,
            })
            .first()
            .click();

        // 4. Selection worker + annee.
        const workerSelect = page.getByLabel(/travailleur|worker/i).first();
        await workerSelect.click();
        await page.getByRole('option').first().click();

        const yearSelect = page.getByLabel(/ann[ée]e|year/i).first();
        await yearSelect.click();
        await page.getByRole('option', { name: /2026|2025/ }).first().click();

        // 5. Raison RGPD obligatoire.
        await page
            .getByLabel(/raison|reason|justification/i)
            .first()
            .fill('Demande du travailleur pour son dossier medical personnel (article R.4451-77).');

        // 6. Generation et capture du download.
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await page
            .getByRole('button', { name: /g[ée]n[ée]rer|generate|t[ée]l[ée]charger|download/i })
            .first()
            .click();

        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        expect(filename.toLowerCase()).toMatch(/\.pdf$/);

        const tmpPath = await download.path();
        if (tmpPath) {
            const stats = await fs.stat(tmpPath);
            // PDF valide : au moins 1 KB.
            expect(stats.size).toBeGreaterThan(1024);
        }

        // 7. Verification de la trace d'audit.
        // Le centre de rapports affiche un compteur ou une ligne d'audit
        // apres chaque generation — on attend qu'il se mette a jour.
        await expect(
            page.getByText(/journalis[ée]|audit|export.*r[ée]ussi|generated/i).first(),
        ).toBeVisible({ timeout: 10000 });
    });
});
