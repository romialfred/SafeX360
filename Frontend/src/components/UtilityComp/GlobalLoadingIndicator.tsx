import { useEffect, useRef, useState } from 'react';
import { subscribe, getPending } from '../../utility/loadingBus';
import { SandglassIcon } from './SandglassLoader';

/**
 * GlobalLoadingIndicator — sablier d'attente global de la plateforme.
 *
 * Monté une seule fois dans App. Écoute le compteur de requêtes API en vol
 * (loadingBus, alimenté par AxiosInterceptor) et affiche, quand une page
 * charge réellement :
 *   - une barre de progression fine en haut de l'écran (balayage émeraude) ;
 *   - un chip sablier discret en bas à droite.
 *
 * Règles anti-flash :
 *   - n'apparaît que si des requêtes restent en vol > SHOW_AFTER_MS ;
 *   - reste affiché au minimum MIN_VISIBLE_MS pour éviter le clignotement.
 */

const SHOW_AFTER_MS = 350;
const MIN_VISIBLE_MS = 450;

const BAR_KEYFRAMES = `
@keyframes sx-bar-sweep {
    0% { left: -35%; width: 35%; }
    50% { left: 30%; width: 45%; }
    100% { left: 100%; width: 35%; }
}
@keyframes sx-chip-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

const GlobalLoadingIndicator = () => {
    const [visible, setVisible] = useState(false);
    const showTimer = useRef<number | null>(null);
    const shownAt = useRef(0);

    useEffect(() => {
        const clearShowTimer = () => {
            if (showTimer.current !== null) {
                window.clearTimeout(showTimer.current);
                showTimer.current = null;
            }
        };

        const onChange = (pending: number) => {
            if (pending > 0) {
                if (showTimer.current === null) {
                    showTimer.current = window.setTimeout(() => {
                        showTimer.current = null;
                        // Re-vérifier : la file peut s'être vidée pendant le délai
                        if (getPending() > 0) {
                            shownAt.current = Date.now();
                            setVisible(true);
                        }
                    }, SHOW_AFTER_MS);
                }
            } else {
                clearShowTimer();
                const elapsed = Date.now() - shownAt.current;
                const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
                window.setTimeout(() => {
                    if (getPending() === 0) setVisible(false);
                }, wait);
            }
        };

        const unsubscribe = subscribe(onChange);
        return () => {
            unsubscribe();
            clearShowTimer();
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            <style>{BAR_KEYFRAMES}</style>
            {/* Barre de progression fine, en haut, au-dessus de tout */}
            <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] overflow-hidden pointer-events-none" aria-hidden="true">
                <div
                    className="absolute h-full rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #059669 30%, #14B8A6 70%, transparent)',
                        animation: 'sx-bar-sweep 1.3s ease-in-out infinite',
                    }}
                />
            </div>
            {/* Chip sablier discret, bas droite */}
            <div
                className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur px-3.5 py-2 pointer-events-none"
                style={{ animation: 'sx-chip-in 0.3s ease-out both' }}
                role="status"
            >
                <SandglassIcon size="sm" />
                <span className="text-[12px] text-slate-600 tracking-wide">Chargement…</span>
            </div>
        </>
    );
};

export default GlobalLoadingIndicator;
