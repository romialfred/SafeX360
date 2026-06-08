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
import { isNativePlatform, getPlatform } from '../utils/capacitorBridge';

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
        try {
            // Lit window.Capacitor expose en runtime APK. Pas d'import statique :
            // evite que Vite scanne @capacitor/core en dev web (ou il n'est pas
            // installe). Cf. src/m/utils/capacitorBridge.ts pour les details.
            const isNative = isNativePlatform();
            const platform = getPlatform() as Platform;
            if (!cancelled) {
                setRuntime({
                    isNative,
                    platform,
                    canUseCamera: isNative,
                    canUseHaptics: isNative,
                    canPushNotify: isNative,
                    canBiometric: isNative,
                    ready: true,
                });
            }
        } catch {
            if (!cancelled) setRuntime({ ...FALLBACK, ready: true });
        }
        return () => {
            cancelled = true;
        };
    }, []);

    return runtime;
}
