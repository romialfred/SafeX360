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
import { getCapacitorPlugin } from '../utils/capacitorBridge';

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

// Constantes ImpactStyle / NotificationType de Capacitor (valeurs string,
// definies dans @capacitor/haptics — on les reproduit ici pour ne pas
// avoir besoin de l'import statique).
const ImpactStyleEnum = { Heavy: 'HEAVY', Medium: 'MEDIUM', Light: 'LIGHT' } as const;
const NotifTypeEnum = { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' } as const;

export function useHaptics() {
    return useCallback(async (pattern: HapticPattern) => {
        try {
            const Haptics = getCapacitorPlugin<any>('Haptics');
            if (!Haptics) {
                // Fallback web
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate(WEB_FALLBACK_MS[pattern]);
                }
                return;
            }
            switch (pattern) {
                case 'light':
                    await Haptics.impact({ style: ImpactStyleEnum.Light });
                    break;
                case 'medium':
                    await Haptics.impact({ style: ImpactStyleEnum.Medium });
                    break;
                case 'heavy':
                    await Haptics.impact({ style: ImpactStyleEnum.Heavy });
                    break;
                case 'success':
                    await Haptics.notification({ type: NotifTypeEnum.Success });
                    break;
                case 'warning':
                    await Haptics.notification({ type: NotifTypeEnum.Warning });
                    break;
                case 'error':
                    await Haptics.notification({ type: NotifTypeEnum.Error });
                    break;
                case 'sos':
                    // Vibration longue
                    await Haptics.vibrate({ duration: 800 });
                    break;
            }
        } catch {
            // ignore silencieusement — un haptic n'est jamais critique
        }
    }, []);
}
