/**
 * useStatusBarColor — Adapte la barre de statut Android au theme de l'ecran.
 *
 * Conventions :
 *   - Accueil    : cyan-700 (#0E7490)
 *   - Inspections: cyan-700
 *   - SOS / Alarme: rouge-700 (#B91C1C)
 *   - Blast      : amber-700 (#B45309)
 *   - Profil     : slate-900 (#0F172A)
 *
 * Sur web : aucun effet (meta theme-color est gere dans index.html).
 */

import { useEffect } from 'react';
import { getCapacitorPlugin } from '../utils/capacitorBridge';

type StatusBarStyle = 'LIGHT' | 'DARK';

// Valeurs enum @capacitor/status-bar.Style (string literals au runtime)
const StyleEnum = { Light: 'LIGHT', Dark: 'DARK' } as const;

export function useStatusBarColor(hex: string, style: StatusBarStyle = 'LIGHT') {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const StatusBar = getCapacitorPlugin<any>('StatusBar');
                if (!StatusBar || cancelled) return;
                await StatusBar.setBackgroundColor?.({ color: hex }).catch(() => undefined);
                await StatusBar.setStyle?.({
                    style: style === 'LIGHT' ? StyleEnum.Light : StyleEnum.Dark,
                }).catch(() => undefined);
            } catch {
                // ignore
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hex, style]);
}
