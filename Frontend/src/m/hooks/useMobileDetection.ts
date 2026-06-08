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
        (async () => {
            let isCapacitor = false;
            try {
                const cap = await import(/* @vite-ignore */ '@capacitor/core').catch(
                    () => null,
                );
                if (cap) {
                    isCapacitor = cap.Capacitor.isNativePlatform();
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

            const isMobile =
                isCapacitor || isSafexUa || (isCoarsePointer && isSmallViewport) || isMobileUa;
            const shouldRedirectToMobile =
                (isCapacitor || isSafexUa || isMobileUa) && !userExplicitlyWantsDesktop();

            setDetection({
                isMobile,
                isCapacitor,
                shouldRedirectToMobile,
                ready: true,
            });
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return detection;
}
