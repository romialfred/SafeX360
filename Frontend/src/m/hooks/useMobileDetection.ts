/**
 * useMobileDetection — Detecte si l'execution se fait sur un appareil mobile
 * ou dans la WebView Capacitor (APK installe).
 *
 * Heuristiques (par ordre de priorite, le 1er match l'emporte) :
 *   1. Capacitor.isNativePlatform() == true  -> isMobile = true
 *   2. User-Agent contient 'safex-field'      -> isMobile = true
 *   3. Viewport width < 768 px ET pointer:coarse -> isMobile = true
 *   4. UA Mozilla mobile (iPhone/Android)     -> isMobile = true (fallback)
 *   5. Sinon                                  -> isMobile = false (desktop)
 *
 * Le drapeau {@code shouldRedirectToMobile} est conservateur : il ne renvoie
 * true que si l'utilisateur est CLAIREMENT sur mobile (1, 2, 4) ET qu'il
 * n'a pas explicitement demande la version web via ?desktop=1.
 */

import { useEffect, useState } from 'react';

export interface MobileDetection {
    isMobile: boolean;
    isCapacitor: boolean;
    shouldRedirectToMobile: boolean;
    ready: boolean;
}

export interface MobileSignals {
    isCapacitor: boolean;
    isSafexUa: boolean;
    isMobileUa: boolean;
    isCoarsePointer: boolean;
    isSmallViewport: boolean;
    prefersDesktop: boolean;
}

export function computeMobileDetection(signals: MobileSignals): MobileDetection {
    const viewportMobile = signals.isCoarsePointer && signals.isSmallViewport;
    const isMobile = signals.isCapacitor || signals.isSafexUa
        || viewportMobile || signals.isMobileUa;
    // La REDIRECTION forcee exige un terminal SUREMENT mobile (Capacitor, UA).
    // `viewportMobile` reste un simple indice d'affichage : un laptop tactile a
    // fenetre etroite etait expulse vers /m/home a chaque navigation, avec pour
    // seule sortie un ?desktop=1 que rien n'annonce. Etre PROBABLEMENT mobile
    // suffit a informer, pas a confisquer l'application desktop.
    const surelyMobile = signals.isCapacitor || signals.isSafexUa || signals.isMobileUa;
    return {
        isMobile,
        isCapacitor: signals.isCapacitor,
        shouldRedirectToMobile: surelyMobile && !signals.prefersDesktop,
        ready: true,
    };
}

const INITIAL: MobileDetection = {
    isMobile: false,
    isCapacitor: false,
    shouldRedirectToMobile: false,
    ready: false,
};

function userExplicitlyWantsDesktop(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('desktop') === '1') return true;
        return window.localStorage.getItem('safex360-prefer-desktop') === '1';
    } catch {
        return false;
    }
}

export function useMobileDetection(): MobileDetection {
    const [detection, setDetection] = useState<MobileDetection>(INITIAL);

    useEffect(() => {
        let cancelled = false;
        const evaluate = () => {
            let isCapacitor = false;
            try {
                // Capacitor injecte window.Capacitor a l'execution native.
                // Pas d'import statique : evite que Vite tente de resoudre
                // @capacitor/core en dev web ou il n'est pas installe.
                const w = typeof window !== 'undefined' ? (window as any) : null;
                if (w?.Capacitor?.isNativePlatform) {
                    isCapacitor = Boolean(w.Capacitor.isNativePlatform());
                }
            } catch {
                isCapacitor = false;
            }
            if (cancelled) return;

            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isSafexUa = /safex-field/i.test(ua);
            const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            const isCoarsePointer =
                typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
            const isSmallViewport =
                typeof window !== 'undefined' && window.innerWidth < 768;

            setDetection(computeMobileDetection({
                isCapacitor,
                isSafexUa,
                isMobileUa,
                isCoarsePointer,
                isSmallViewport,
                prefersDesktop: userExplicitlyWantsDesktop(),
            }));
        };
        evaluate();
        window.addEventListener('resize', evaluate);
        return () => {
            cancelled = true;
            window.removeEventListener('resize', evaluate);
        };
    }, []);

    return detection;
}
