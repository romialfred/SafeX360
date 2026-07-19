import { expect, test } from '@playwright/test';

test.describe('accessibilité de la page publique SafeX', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('conserve une structure nommée, sans débordement ni mouvement imposé', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');

        await expect(page.locator('html')).toHaveAttribute('lang', /^fr/i);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.getByRole('main')).toHaveCount(1);

        const unnamedControls = await page.locator('a, button, input, select, textarea').evaluateAll((elements) =>
            elements
                .filter((element) => {
                    const style = getComputedStyle(element);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                })
                .filter((element) => {
                    const label = element.getAttribute('aria-label')
                        ?? element.getAttribute('title')
                        ?? element.textContent
                        ?? '';
                    const labelledBy = element.getAttribute('aria-labelledby');
                    const imageAlt = element.querySelector('img')?.getAttribute('alt');
                    return !label.trim() && !labelledBy && !imageAlt?.trim();
                })
                .map((element) => element.outerHTML.slice(0, 180)),
        );
        expect(unnamedControls).toEqual([]);

        const viewportFits = await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        );
        expect(viewportFits).toBe(true);

        const longestMotionMs = await page.locator('body *').evaluateAll((elements) => {
            const durations = elements.flatMap((element) => {
                const style = getComputedStyle(element);
                return `${style.animationDuration},${style.transitionDuration}`
                    .split(',')
                    .map((value) => value.trim())
                    .map((value) => value.endsWith('ms')
                        ? Number.parseFloat(value)
                        : Number.parseFloat(value) * 1000)
                    .filter(Number.isFinite);
            });
            return Math.max(0, ...durations);
        });
        expect(longestMotionMs).toBeLessThanOrEqual(0.02);
    });
});
