/**
 * useRedirectTimer — setTimeout auto-nettoyé au démontage du composant.
 *
 * Utilisé par les écrans de déclaration pour la redirection différée après
 * l'écran de confirmation : sans nettoyage, quitter l'écran avant la fin du
 * délai déclenche une navigation fantôme (l'utilisateur est arraché de la
 * page qu'il vient d'ouvrir).
 */

import { useCallback, useEffect, useRef } from 'react';

export function useRedirectTimer(): (fn: () => void, delayMs: number) => void {
    const timer = useRef<number | null>(null);

    useEffect(() => () => {
        if (timer.current !== null) window.clearTimeout(timer.current);
    }, []);

    return useCallback((fn: () => void, delayMs: number) => {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(fn, delayMs);
    }, []);
}
