/**
 * useCapacitorRuntime — Detection runtime du contexte d'execution.
 *
 * Le code mobile partage le bundle JavaScript avec la version web. Pour
 * activer/desactiver les APIs natives selon le contexte (Capacitor APK vs
 * Vite dev vs preview web), ce hook expose des drapeaux fiables :
 *
 *   - isNative        : true si tourne dans la WebView Capacitor (APK)
 *   - platform        : 'android' | 'ios' | 'web'
 *   - canUseCamera    : true si on peut appeler @capacitor/camera (sinon
 *                       fallback HTML5 <input capture>)
 *   - canUseHaptics   : idem haptics
 *   - canPushNotify   : idem push notifications
 *
 * Pour le M0, on importe @capacitor/core dynamiquement via un import.meta.glob
 * lazy pour ne pas planter le bundle web si Capacitor n'est pas encore
 * installe (`npm install` pas encore execute).
 */

import { useEffect, useState } from 'react';

type Platform = 'android' | 'ios' | 'web';

interface CapacitorRuntime {
    isNative: boolean;
    platform: Platform;
    canUseCamera: boolean;
    canUseHaptics: boolean;
    canPushNotify: boolean;
    canBiometric: boolean;
    ready: boolean;
}

const FALLBACK: CapacitorRuntime = {
    isNative: false,
    platform: 'web',
    canUseCamera: false,
    canUseHaptics: false,
    canPushNotify: false,
    canBiometric: false,
    ready: false,
};

export function useCapacitorRuntime(): CapacitorRuntime {
    const [runtime, setRuntime] = useState<CapacitorRuntime>(FALLBACK);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Import dynamique : ne casse pas le bundle web tant que
                // Capacitor n'est pas installe (le module est lazy resolved
                // au runtime). En cas d'echec, on garde le fallback web.
                const cap = await import(/* @vite-ignore */ '@capacitor/core').catch(
                    () => null,
                );
                if (!cap || cancelled) {
                    setRuntime({ ...FALLBACK, ready: true });
                    return;
                }
                const { Capacitor } = cap;
                const platform = Capacitor.getPlatform() as Platform;
                const isNative = Capacitor.isNativePlatform();
                setRuntime({
                    isNative,
                    platform,
                    canUseCamera: isNative,
                    canUseHaptics: isNative,
                    canPushNotify: isNative,
                    canBiometric: isNative,
                    ready: true,
                });
            } catch {
                setRuntime({ ...FALLBACK, ready: true });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return runtime;
}
