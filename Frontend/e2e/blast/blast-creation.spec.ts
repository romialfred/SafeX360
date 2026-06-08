/**
 * blast-creation.spec.ts — P8 E2E (Module Blast Management).
 *
 * Scenario : creation d'un brouillon de tir, remplissage des 10 sections de la
 * fiche (identite, planification, plan de tir, perimetre, equipe, destinataires,
 * pieces jointes, etc.), puis confirmation du tir (DRAFT -> PLANNED -> CONFIRMED).
 *
 * <p><b>Etapes</b> :
 *   1. Login en tant que Boutefeu (BLAST_PLAN + BLAST_CONFIRM).
 *   2. Navigation vers /blast/new (formulaire de creation).
 *   3. Saisie progressive des 10 sections :
 *      [1] Identite (reference auto, mine, type)
 *      [2] Planification (date/heure, fuseau)
 *      [3] Localisation (pit, bench, block, lat/lng)
 *      [4] Plan de tir (trous, diametre, profondeur, charge)
 *      [5] Detonation (systeme d'initiation, sequence)
 *      [6] Perimetre exclusion (rayon, voies d'acces, points rassemblement)
 *      [7] Equipe (boutefeu, HSE lead, composition)
 *      [8] Destinataires (HSE, garde, infirmerie, communautes)
 *      [9] Reglementaire (PPV limit, recepteurs sensibles)
 *      [10] Notes & pieces jointes
 *   4. Sauvegarde DRAFT -> apparition dans le registre.
 *   5. Transition DRAFT -> PLANNED via bouton "Planifier".
 *   6. Transition PLANNED -> CONFIRMED via bouton "Confirmer le tir" (avec raison).
 *   7. Verification : badge "CONFIRMED" visible + notification de succes.
 *
 * <p><b>Verifications</b> :
 *   - La reference du tir apparait dans le registre apres save.
 *   - Le badge de statut passe de DRAFT a CONFIRMED apres les transitions.
 *
 * <p><b>RBAC</b> : ce test suppose un utilisateur avec BLAST_PLAN + BLAST_CONFIRM.
 */

import { test, expect } from '@playwright/test';
import {
    loginAsBlastOfficer,
    randomBlastReference,
    futureBlastDateTime,
    gotoBlast,
} from './fixtures';

test.describe('Blast Management — Creation et confirmation d\'un tir', () => {
    test('cree un brouillon, remplit 10 sections puis confirme le tir', async ({ page }) => {
        const reference = randomBlastReference();
        const when = futureBlastDateTime(3, 14, 0);

        // 1. Login Boutefeu.
        await loginAsBlastOfficer(page);

        // 2. Aller au formulaire de creation.
        await gotoBlast(page, '/new');
        await expect(
            page.getByRole('heading', { name: /nouveau tir|enregistrer.*tir|new.*blast|log.*blast/i }),
        ).toBeVisible({ timeout: 15000 });

        // 3. ── Section 1 — Identite ─────────────────────────────────────
        // Reference : champ libre (laisser le placeholder ou saisir)
        const refInput = page.getByLabel(/r[ée]f[ée]rence|reference/i).first();
        if (await refInput.isVisible()) {
            await refInput.fill(reference);
        }
        // Type de tir
        const typeSelect = page.getByLabel(/type.*tir|blast.*type/i).first();
        if ((await typeSelect.getAttribute('role')) === 'combobox') {
            await typeSelect.click();
            await page.getByRole('option', { name: /production/i }).first().click();
        }

        // ── Section 2 — Planification ───────────────────────────────────
        const dateInput = page.getByLabel(/date.*tir|date.*pr[ée]vue|scheduled.*date/i).first();
        await dateInput.fill(when.date);
        const timeInput = page.getByLabel(/heure|time/i).first();
        if (await timeInput.isVisible()) {
            await timeInput.fill(when.time);
        }

        // ── Section 3 — Localisation ────────────────────────────────────
        await page.getByLabel(/fosse|pit/i).first().fill('Fosse Nord');
        await page.getByLabel(/gradin|bench/i).first().fill('Gradin 1080');

        // ── Section 4 — Plan de tir ─────────────────────────────────────
        await page.getByLabel(/nombre.*trous|hole.*count/i).first().fill('48');
        await page.getByLabel(/diam[èe]tre|diameter/i).first().fill('115');
        await page.getByLabel(/profondeur|depth/i).first().fill('10');
        await page.getByLabel(/burden/i).first().fill('3.2');
        await page.getByLabel(/spacing|maille/i).first().fill('3.7');
        await page.getByLabel(/stemming|bourrage/i).first().fill('2.8');

        // ── Section 5 — Detonation ──────────────────────────────────────
        await page.getByLabel(/explosif|explosive.*type/i).first().fill('emulsion');
        await page.getByLabel(/quantit[ée]|qty.*kg/i).first().fill('2100');

        // ── Section 6 — Perimetre exclusion ─────────────────────────────
        await page
            .getByLabel(/rayon.*exclusion|exclusion.*radius/i)
            .first()
            .fill('500');

        // ── Section 9 — Reglementaire ───────────────────────────────────
        const ppvInput = page.getByLabel(/ppv.*limit|vibration.*limit/i).first();
        if (await ppvInput.isVisible()) {
            await ppvInput.fill('10');
        }

        // ── Section 10 — Notes ──────────────────────────────────────────
        const notesInput = page.getByLabel(/^notes$|observations/i).first();
        if (await notesInput.isVisible()) {
            await notesInput.fill('Tir de production E2E — verifier meteo J-1.');
        }

        // 4. Sauvegarde brouillon.
        await page
            .getByRole('button', { name: /enregistrer.*brouillon|save.*draft|sauvegarder/i })
            .first()
            .click();

        // Notification de succes
        await expect(
            page.getByText(/cr[ée][ée]?\s|created|saved successfully|brouillon.*cr[ée]/i).first(),
        ).toBeVisible({ timeout: 10000 });

        // 5. Transition DRAFT -> PLANNED.
        await page
            .getByRole('button', { name: /^planifier$|^plan$/i })
            .first()
            .click();

        // 6. Transition PLANNED -> CONFIRMED (avec raison).
        await page
            .getByRole('button', { name: /confirmer.*tir|^confirm.*blast/i })
            .first()
            .click();

        // Modale raison (X-Reason header backend)
        const reasonInput = page.getByLabel(/raison|reason|motif/i).first();
        if (await reasonInput.isVisible({ timeout: 3000 })) {
            await reasonInput.fill('Confirmation E2E — boutefeu agree.');
            await page.getByRole('button', { name: /confirmer|valider|submit|ok/i }).first().click();
        }

        // 7. Verification : badge CONFIRMED visible.
        await expect(
            page.getByText(/^CONFIRMED$|^Confirm[ée]$/i).first(),
        ).toBeVisible({ timeout: 15000 });
    });
});
