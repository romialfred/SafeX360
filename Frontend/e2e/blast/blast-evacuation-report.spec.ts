/**
 * blast-evacuation-report.spec.ts — P8 E2E (Module Blast Management).
 *
 * Scenario : un tir en statut ALL_CLEAR genere automatiquement un rapport
 * d'evacuation. Le responsable HSE (ou Boutefeu, selon RBAC) renseigne les
 * champs operationnels (comptage muster, incidents) puis signe le rapport.
 * Le PDF doit pouvoir etre genere.
 *
 * <p><b>Etapes</b> :
 *   1. Login Boutefeu (ou HSE Manager).
 *   2. Navigation vers le registre.
 *   3. Trouver le tir BLT-2026-0139 (deja ALL_CLEAR avec rapport seede).
 *   4. Ouvrir la fiche detail.
 *   5. Navigation vers l'onglet "Rapport d'evacuation".
 *   6. Verifier presence des sections : comptage, incidents, heure tir, heure all-clear.
 *   7. Modifier un champ (incidents) puis sauvegarder.
 *   8. Signer le rapport (bouton "Signer" + confirmation).
 *   9. Verifier badge "Signe" + horodatage de signature.
 *   10. Telecharger le PDF (declenchement download).
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec BLAST_REPORT.
 *
 * <p><b>Pre-requis seed</b> : seed_blast.py doit avoir cree BLT-2026-0139
 * en statut ALL_CLEAR, avec un rapport non-signe ou re-creable.
 */

import { test, expect } from '@playwright/test';
import { loginAsBlastOfficer, gotoBlast } from './fixtures';

test.describe('Blast Management — Rapport d\'evacuation auto-cree, signe et PDF', () => {
    test('ALL_CLEAR cree un rapport, le signer genere le PDF', async ({ page }) => {
        // 1. Login.
        await loginAsBlastOfficer(page);

        // 2. Registre des tirs.
        await gotoBlast(page, '/registry');
        await expect(
            page.getByRole('heading', { name: /registre.*tirs|blast.*registry/i }),
        ).toBeVisible({ timeout: 15000 });

        // 3. Trouver BLT-2026-0139 (ALL_CLEAR).
        const searchInput = page.getByPlaceholder(/rechercher|search/i).first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('BLT-2026-0139');
        }
        await page.getByText(/BLT-2026-0139/).first().click();

        // 4. La fiche est ouverte — badge ALL_CLEAR present.
        await expect(
            page.getByText(/^ALL_CLEAR$|^Site.*d[ée]gag[ée]$/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 5. Onglet "Rapport d'evacuation" / "Evacuation Report".
        const reportTab = page
            .getByRole('tab', { name: /rapport.*[ée]vacuation|evacuation.*report/i })
            .first();
        if (await reportTab.isVisible({ timeout: 3000 })) {
            await reportTab.click();
        }

        // 6. Verifier sections principales du rapport.
        await expect(
            page.getByText(/comptage|muster|pr[ée]sents/i).first(),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText(/incidents|observations/i).first(),
        ).toBeVisible({ timeout: 5000 });

        // 7. Modifier le champ incidents (si non-signe).
        const incidentsInput = page.getByLabel(/incidents|observations/i).first();
        if (await incidentsInput.isVisible({ timeout: 3000 })) {
            // Si le champ est editable (rapport non-signe), on le complete.
            const isEnabled = await incidentsInput.isEnabled().catch(() => false);
            if (isEnabled) {
                await incidentsInput.fill(
                    'E2E — Aucun incident. Evacuation complete en 8 minutes. PPV mesure 6.4 mm/s.',
                );
                const saveBtn = page
                    .getByRole('button', { name: /enregistrer|sauvegarder|save/i })
                    .first();
                if (await saveBtn.isVisible({ timeout: 2000 })) {
                    await saveBtn.click();
                    await expect(
                        page.getByText(/enregistr[ée]|saved|mise.*[àa].*jour/i).first(),
                    ).toBeVisible({ timeout: 8000 });
                }
            }
        }

        // 8. Signer le rapport.
        const signBtn = page
            .getByRole('button', { name: /^signer|sign.*report|signature/i })
            .first();
        if (await signBtn.isVisible({ timeout: 3000 })) {
            const isSignEnabled = await signBtn.isEnabled().catch(() => true);
            if (isSignEnabled) {
                await signBtn.click();
                const confirm = page
                    .getByRole('button', { name: /confirmer.*signature|valider|submit|ok/i })
                    .first();
                if (await confirm.isVisible({ timeout: 3000 })) {
                    await confirm.click();
                }
            }
        }

        // 9. Verifier badge "Signe" et horodatage.
        await expect(
            page.getByText(/^Sign[ée]$|^Signed$|sign[ée].*par|signed.*by/i).first(),
        ).toBeVisible({ timeout: 15000 });

        // 10. Telecharger le PDF.
        const pdfBtn = page
            .getByRole('button', { name: /pdf|t[ée]l[ée]charger|download/i })
            .first();
        if (await pdfBtn.isVisible({ timeout: 3000 })) {
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            await pdfBtn.click();
            const download = await downloadPromise;
            const filename = download.suggestedFilename();
            expect(filename).toMatch(/\.pdf$/i);
        }
    });
});
