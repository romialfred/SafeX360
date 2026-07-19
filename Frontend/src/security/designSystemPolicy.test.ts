import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const file = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('maîtrise du design system', () => {
    it('centralise les couleurs HSE et les statuts dans le thème versionné', () => {
        const theme = file('src/theme.tsx');
        for (const token of ['brandTeal', 'hseRed', 'hseOrange', 'hseYellow', 'hseGreen', 'hseBlue']) {
            expect(theme).toContain(token);
        }
        expect(theme).toContain('hseSeverity');
        expect(theme).toContain('incidentStatus');
    });

    it('dispose d’une garde mesurable contre toute nouvelle valeur arbitraire', () => {
        const guard = file('scripts/check-design-debt-baseline.mjs');
        expect(guard).toContain('hexColors');
        expect(guard).toContain('inlineStyles');
        expect(guard).toContain('pixelValues');
        expect(guard).toContain('maxWidthUtilities');
        expect(guard).toContain('transitionAll');
    });
});
