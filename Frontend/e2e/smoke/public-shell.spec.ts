import { expect, test } from '@playwright/test';

test.describe('coquille publique SafeX', () => {
    test('affiche la page publique sans service externe', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/SafeX 360/i);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('redirige /landing en preservant query et fragment', async ({ page }) => {
        await page.goto('/landing?source=qa#contact');

        await expect(page).toHaveURL(/\/?source=qa#contact$/);
    });
});
