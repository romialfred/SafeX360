/**
 * SyncIndicator — Bandeau discret en haut de l'app qui affiche le nombre
 * d'actions en attente de synchronisation. Cliquer dessus relance manuellement
 * le replay de la queue.
 *
 * Etats visuels :
 *   - 0 pending, 0 syncing : composant masque
 *   - X pending, online    : bandeau cyan "X action(s) en attente de sync"
 *   - X pending, offline   : non rendu (le banner offline du Shell suffit)
 *   - running              : spinner anime + texte "Synchronisation en cours…"
 *   - failed > 0           : badge orange "X echec(s)" cliquable pour reessayer
 */

import { IconCloudUpload, IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function SyncIndicator() {
    const { pending, syncing, failed, running, runNow } = useSyncQueue();
    const { online } = useNetworkStatus();

    // Rien a signaler ou offline (banner Shell suffit)
    if (pending === 0 && syncing === 0 && failed === 0) return null;
    if (!online) return null;

    return (
        <button
            type="button"
            onClick={runNow}
            disabled={running}
            className="w-full bg-cyan-50 border-b border-cyan-200 text-cyan-900 text-[12.5px] px-4 py-2 flex items-center justify-between gap-2 transition active:bg-cyan-100"
            aria-label="Synchronisation des donnees"
        >
            <div className="flex items-center gap-2 min-w-0">
                {running ? (
                    <IconRefresh size={14} stroke={1.8} className="animate-spin flex-shrink-0" />
                ) : failed > 0 ? (
                    <IconAlertTriangle size={14} stroke={1.8} className="text-amber-600 flex-shrink-0" />
                ) : (
                    <IconCloudUpload size={14} stroke={1.8} className="flex-shrink-0" />
                )}
                <span className="truncate">
                    {running && 'Synchronisation en cours…'}
                    {!running && pending > 0 && `${pending} saisie${pending > 1 ? 's' : ''} en attente d'envoi`}
                    {!running && pending === 0 && failed > 0 && `${failed} echec${failed > 1 ? 's' : ''} de synchronisation`}
                </span>
            </div>
            {!running && (
                <span className="text-[11px] underline font-medium">Reessayer</span>
            )}
        </button>
    );
}
