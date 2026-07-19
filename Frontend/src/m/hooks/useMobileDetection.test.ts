import { describe, expect, it } from 'vitest';
import { computeMobileDetection } from './useMobileDetection';

const desktop = {
    isCapacitor: false,
    isSafexUa: false,
    isMobileUa: false,
    isCoarsePointer: false,
    isSmallViewport: false,
    prefersDesktop: false,
};

describe('computeMobileDetection', () => {
    it('reconnait un viewport 375px tactile comme mobile SANS le rediriger de force', () => {
        const result = computeMobileDetection({
            ...desktop,
            isCoarsePointer: true,
            isSmallViewport: true,
        });

        // POLITIQUE : etre PROBABLEMENT mobile (fenetre etroite + tactile)
        // informe l'affichage, mais ne confisque pas l'application desktop.
        // Un laptop tactile a fenetre reduite etait expulse vers /m/home a
        // chaque navigation, seule sortie un ?desktop=1 que rien n'annonce.
        // La redirection forcee exige un terminal SUREMENT mobile (UA,
        // Capacitor) — cas couvert par le test suivant.
        expect(result.isMobile).toBe(true);
        expect(result.shouldRedirectToMobile).toBe(false);
    });

    it('redirige un terminal surement mobile (user-agent)', () => {
        const result = computeMobileDetection({
            ...desktop,
            isMobileUa: true,
        });

        expect(result.isMobile).toBe(true);
        expect(result.shouldRedirectToMobile).toBe(true);
    });

    it('respecte le choix explicite de la version desktop', () => {
        const result = computeMobileDetection({
            ...desktop,
            isMobileUa: true,
            prefersDesktop: true,
        });

        expect(result.isMobile).toBe(true);
        expect(result.shouldRedirectToMobile).toBe(false);
    });

    it('conserve l interface desktop sur grand écran avec pointeur précis', () => {
        expect(computeMobileDetection(desktop).shouldRedirectToMobile).toBe(false);
    });
});

