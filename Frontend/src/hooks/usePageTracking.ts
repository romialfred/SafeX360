import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Traçabilité des pages consultées.
 *
 * Une application monopage navigue SANS appeler le serveur : sans ce mécanisme,
 * l'historique d'un utilisateur s'arrêterait aux appels d'API et ne dirait rien
 * des écrans réellement ouverts. On déclare donc les changements de route.
 *
 * Trois précautions, parce qu'une trace ne doit jamais dégrader l'usage :
 *  - ENVOI GROUPÉ toutes les 10 s : une navigation rapide entre trois écrans
 *    produit une requête, pas trois ;
 *  - ÉCHEC SILENCIEUX : une trace perdue ne remonte aucune erreur à l'écran ;
 *  - ENVOI À LA FERMETURE via sendBeacon, seul mécanisme que le navigateur
 *    honore encore pendant qu'il décharge la page.
 *
 * L'identité vient exclusivement du cookie : le corps de la requête ne désigne
 * personne, il est donc impossible d'écrire dans l'historique d'autrui.
 */

interface Visit {
    path: string;
    label: string;
    source: string;
}

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER = 40;

export function usePageTracking(enabled: boolean = true): void {
    const location = useLocation();
    const buffer = useRef<Visit[]>([]);
    const lastPath = useRef<string>('');

    // Empile la route courante (en ignorant une répétition immédiate : un simple
    // changement de paramètre de recherche ne vaut pas une nouvelle visite).
    useEffect(() => {
        if (!enabled) return;
        const path = location.pathname;
        if (!path || path === lastPath.current) return;
        lastPath.current = path;
        if (buffer.current.length < MAX_BUFFER) {
            buffer.current.push({ path, label: document.title || path, source: 'WEB' });
        }
    }, [location.pathname, enabled]);

    useEffect(() => {
        if (!enabled) return undefined;

        const flush = () => {
            if (buffer.current.length === 0) return;
            const visits = buffer.current.splice(0, buffer.current.length);
            axiosInstance.post('/hrms/activity/pages', { visits }).catch(() => {
                // Silencieux par construction : perdre une trace est sans gravité,
                // afficher une erreur de traçage à l'utilisateur ne l'est pas.
            });
        };

        const flushOnUnload = () => {
            if (buffer.current.length === 0) return;
            const visits = buffer.current.splice(0, buffer.current.length);
            try {
                const blob = new Blob([JSON.stringify({ visits })], { type: 'application/json' });
                // sendBeacon : le seul envoi que le navigateur poursuit pendant qu'il
                // décharge la page. Le cookie de session part avec (même origine).
                navigator.sendBeacon?.('/hrms/activity/pages', blob);
            } catch {
                /* rien à faire : la page se ferme */
            }
        };

        const timer = window.setInterval(flush, FLUSH_INTERVAL_MS);
        window.addEventListener('pagehide', flushOnUnload);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') flushOnUnload();
        });

        return () => {
            window.clearInterval(timer);
            window.removeEventListener('pagehide', flushOnUnload);
            flush();
        };
    }, [enabled]);
}

export default usePageTracking;
