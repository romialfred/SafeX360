import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('garde-fous accessibilité SafeX', () => {
    it('réserve le h1 au contenu de la route authentifiée', () => {
        expect(read('src/components/Dashboard/Header/Header.tsx')).not.toContain('<h1');
        expect(read('src/components/UtilityComp/SafeXLogoColor.tsx')).not.toContain('<h1');
        expect(read('src/components/UtilityComp/PageHeader.tsx')).toContain('<h1');
        expect(read('src/components/NewComponents/LandingPage/LandingPage.tsx')).toContain('<main>');
    });

    it('structure et nomme les commandes du registre ISO', () => {
        const iso = read('src/components/NewComponents/ISODocuments/ISODocuments.tsx');
        expect(iso).toContain('aria-label="Rechercher un référentiel ISO"');
        expect(iso).toContain('<nav aria-label="Référentiels ISO"');
        expect(iso).toContain('aria-pressed={selectedItem}');
        expect(iso).toContain('Registre des références ISO');
    });

    it('neutralise globalement le mouvement non essentiel', () => {
        const css = read('src/App.css');
        expect(css).toContain('@media (prefers-reduced-motion: reduce)');
        expect(css).toContain('animation-duration: 0.01ms !important');
        expect(css).toContain('animation-iteration-count: 1 !important');
    });
});
