import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('budget PWA terrain', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    it("limite le précache au document d'amorçage", () => {
        expect(config).toContain("globPatterns: ['index.html']");
        expect(config).toContain('maximumFileSizeToCacheInBytes: 512 * 1024');
        expect(config).not.toContain("globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']");
    });

    it('conserve un cache à la demande pour les ressources statiques visitées', () => {
        expect(config).toContain("['script', 'style', 'font'].includes(request.destination)");
        expect(config).toContain("cacheName: 'safex-static'");
    });

    it('charge les pages métier à la demande derrière un fallback global', () => {
        const router = readFileSync(resolve(process.cwd(), 'src/routes/Router.tsx'), 'utf8');
        const lazyPages = router.match(/= lazy\(\(\) => import\(/g) ?? [];

        expect(lazyPages.length).toBeGreaterThanOrEqual(150);
        expect(router).toContain('<Suspense fallback={<PageLoader');
        expect(router).toContain('<RouterProvider router={router} />');
    });

    it('publie un manifeste et bloque les régressions de poids en CI', () => {
        const checker = readFileSync(
            resolve(process.cwd(), 'scripts/check-performance-budgets.mjs'),
            'utf8',
        );

        expect(config).toContain('manifest: true');
        expect(checker).toContain('initialJavaScript: 2 * 1024 * 1024');
        expect(checker).toContain('largestJavaScriptChunk: 1536 * 1024');
        expect(checker).toContain('precache: 512 * 1024');
        expect(checker).toContain("manifest.json");
    });
});
