import { useEffect, useState } from 'react';

/**
 * useBreakpoint — détection responsive synchronisée avec Tailwind 4.
 *
 * Breakpoints :
 *   xs : < 640px  (mobile portrait)
 *   sm : 640px+   (mobile landscape)
 *   md : 768px+   (tablet portrait)
 *   lg : 1024px+  (tablet landscape / small laptop)
 *   xl : 1280px+  (desktop)
 *   2xl: 1536px+  (large desktop)
 *
 * Renvoie un objet avec :
 *   - current : 'xs'|'sm'|'md'|'lg'|'xl'|'2xl' — le breakpoint actuel
 *   - isMobile : true si < md (< 768)
 *   - isTablet : true si md ou lg (768..1023)
 *   - isDesktop : true si lg ou plus (>= 1024)
 *   - is(name) / above(name) / below(name) — helpers
 *
 * Utilisation :
 *   const bp = useBreakpoint();
 *   if (bp.isMobile) return <CardList />;
 *   return <DataTable />;
 *
 * Le composant doit être un client component (useEffect attendu).
 * SSR-safe : valeur initiale `desktop` côté serveur.
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: Record<Breakpoint, number> = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

function pickBreakpoint(width: number): Breakpoint {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
}

export interface BreakpointInfo {
    current: Breakpoint;
    width: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    is: (bp: Breakpoint) => boolean;
    above: (bp: Breakpoint) => boolean;
    below: (bp: Breakpoint) => boolean;
}

export function useBreakpoint(): BreakpointInfo {
    const [width, setWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return 1280;
        return window.innerWidth;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let raf = 0;
        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setWidth(window.innerWidth));
        };
        window.addEventListener('resize', onResize, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    const current = pickBreakpoint(width);

    return {
        current,
        width,
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        is: (bp) => current === bp,
        above: (bp) => width >= BREAKPOINTS[bp],
        below: (bp) => width < BREAKPOINTS[bp],
    };
}

export default useBreakpoint;
