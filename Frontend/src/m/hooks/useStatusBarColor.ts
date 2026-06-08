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

type StatusBarStyle = 'LIGHT' | 'DARK';

export function useStatusBarColor(hex: string, style: StatusBarStyle = 'LIGHT') {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const mod = await import(/* @vite-ignore */ '@capacitor/status-bar').catch(
                    () => null,
                );
                if (!mod || cancelled) return;
                const { StatusBar, Style } = mod;
                await StatusBar.setBackgroundColor({ color: hex }).catch(() => undefined);
                await StatusBar.setStyle({
                    style: style === 'LIGHT' ? Style.Light : Style.Dark,
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
