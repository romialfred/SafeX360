/**
 * useHaptics — Vibrations tactiles via @capacitor/haptics.
 *
 * Patterns predefinis pour les interactions HSE critiques :
 *   - light    : tap d'une tuile, selection
 *   - medium   : ajout d'un point de controle conforme
 *   - heavy    : confirmation d'une saisie critique (NUMERIC hors plage)
 *   - success  : sauvegarde reussie
 *   - warning  : pre-alerte tir T-10
 *   - error    : echec sauvegarde, perte reseau
 *   - sos      : declenchement SOS (vibration longue 800ms)
 *
 * Fallback navigator.vibrate sur web si Capacitor indisponible.
 */

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'sos';

const WEB_FALLBACK_MS: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [25, 50, 25],
    warning: [50, 100, 50],
    error: [100, 50, 100, 50, 100],
    sos: 800,
};

export function useHaptics() {
    return useCallback(async (pattern: HapticPattern) => {
        try {
            const mod = await import(/* @vite-ignore */ '@capacitor/haptics').catch(
                () => null,
            );
            if (!mod) {
                // Fallback web
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate(WEB_FALLBACK_MS[pattern]);
                }
                return;
            }
            const { Haptics, ImpactStyle, NotificationType } = mod;
            switch (pattern) {
                case 'light':
                    await Haptics.impact({ style: ImpactStyle.Light });
                    break;
                case 'medium':
                    await Haptics.impact({ style: ImpactStyle.Medium });
                    break;
                case 'heavy':
                    await Haptics.impact({ style: ImpactStyle.Heavy });
                    break;
                case 'success':
                    await Haptics.notification({ type: NotificationType.Success });
                    break;
                case 'warning':
                    await Haptics.notification({ type: NotificationType.Warning });
                    break;
                case 'error':
                    await Haptics.notification({ type: NotificationType.Error });
                    break;
                case 'sos':
                    // Vibration longue + 2 impacts heavy en complement
                    await Haptics.vibrate({ duration: 800 });
                    break;
            }
        } catch {
            // ignore silencieusement — un haptic n'est jamais critique
        }
    }, []);
}
