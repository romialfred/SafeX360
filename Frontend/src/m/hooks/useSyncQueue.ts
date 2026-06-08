/**
 * useSyncQueue — Hook React qui expose l'etat de la queue de synchronisation
 * et permet de declencher manuellement un replay (bouton "Synchroniser
 * maintenant" ou pull-to-refresh).
 *
 * Renvoie { stats, running, runNow } reactifs. Auto-actualise toutes les 3 s
 * tant que la queue n'est pas vide, et sur chaque evenement emis par le moteur.
 */

import { useEffect, useState, useCallback } from 'react';
import { syncEngine } from '../offline/syncEngine';

interface SyncQueueState {
    pending: number;
    syncing: number;
    failed: number;
    done: number;
    running: boolean;
}

const INITIAL: SyncQueueState = {
    pending: 0,
    syncing: 0,
    failed: 0,
    done: 0,
    running: false,
};

export function useSyncQueue() {
    const [state, setState] = useState<SyncQueueState>(INITIAL);

    const refresh = useCallback(async () => {
        const stats = await syncEngine.getStats();
        setState((s) => ({ ...stats, running: s.running }));
    }, []);

    useEffect(() => {
        // Init
        void refresh();
        // Subscribe aux evenements du moteur
        const offStarted = syncEngine.on('started', () => {
            setState((s) => ({ ...s, running: true }));
        });
        const offCompleted = syncEngine.on('completed', (stats) => {
            setState({ ...stats, running: false });
        });
        const offFailed = syncEngine.on('failed', (stats) => {
            setState({ ...stats, running: false });
        });
        const offProgress = syncEngine.on('progress', (stats) => {
            setState({ ...stats, running: true });
        });
        // Polling local toutes les 3 s tant qu'il reste des entries pending
        const poll = window.setInterval(() => {
            void refresh();
        }, 3000);
        return () => {
            offStarted();
            offCompleted();
            offFailed();
            offProgress();
            clearInterval(poll);
        };
    }, [refresh]);

    const runNow = useCallback(() => {
        void syncEngine.run();
    }, []);

    return {
        ...state,
        runNow,
        refresh,
    };
}
