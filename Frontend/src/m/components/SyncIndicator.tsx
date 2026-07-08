/**
 * SyncIndicator — Bandeau discret en haut de l'app qui affiche le nombre
 * d'actions en attente de synchronisation. Cliquer dessus relance manuellement
 * le replay de la queue.
 *
 * Etats visuels :
 *   - 0 pending, 0 syncing, 0 failed, 0 photos : composant masque
 *   - X pending, online    : bandeau cyan "X action(s) en attente de sync"
 *   - X pending, offline   : non rendu (le banner offline du Shell suffit)
 *   - running              : spinner anime + texte "Synchronisation en cours…"
 *   - failed > 0           : badge ambre cliquable ouvre le drawer conflit
 *   - photos > 0 seul      : "X photo(s) en attente d'envoi"
 *
 * Phase M4 : ouverture du SyncConflictDrawer pour resolution manuelle des
 * mutations 'failed'.
 */

import { useState } from 'react';
import { IconCloudUpload, IconRefresh, IconAlertTriangle, IconPhoto } from '@tabler/icons-react';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import SyncConflictDrawer from './SyncConflictDrawer';

export default function SyncIndicator() {
    const { pending, syncing, failed, photosPending, running, runNow } = useSyncQueue();
    const { online } = useNetworkStatus();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Rien a signaler ou offline (banner Shell suffit)
    if (pending === 0 && syncing === 0 && failed === 0 && photosPending === 0) return null;
    if (!online) return null;

    const handleClick = () => {
        if (failed > 0 && !running) {
            // Si echecs en file, on ouvre le drawer pour resolution manuelle.
            setDrawerOpen(true);
        } else {
            // Sinon, on relance le sync.
            runNow();
        }
    };

    const buildLabel = () => {
        if (running) return 'Synchronisation en cours…';
        if (pending > 0) {
            const photoSuffix =
                photosPending > 0
                    ? ` + ${photosPending} photo${photosPending > 1 ? 's' : ''}`
                    : '';
            return `${pending} saisie${pending > 1 ? 's' : ''} en attente d'envoi${photoSuffix}`;
        }
        if (failed > 0) {
            return `${failed} echec${failed > 1 ? 's' : ''} de synchronisation`;
        }
        if (photosPending > 0) {
            return `${photosPending} photo${photosPending > 1 ? 's' : ''} en attente d'envoi`;
        }
        return '';
    };

    const tone = failed > 0
        ? 'bg-amber-50 border-amber-200 text-amber-900 active:bg-amber-100'
        : 'bg-cyan-50 border-cyan-200 text-cyan-900 active:bg-cyan-100';

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={running}
                className={`w-full border-b text-[12.5px] px-4 py-2 flex items-center justify-between gap-2 transition ${tone}`}
                aria-label={failed > 0 ? 'Ouvrir la resolution des echecs' : 'Synchronisation des donnees'}
                style={{ minHeight: 44 }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {running ? (
                        <IconRefresh size={14} stroke={1.8} className="animate-spin flex-shrink-0" />
                    ) : failed > 0 ? (
                        <IconAlertTriangle size={14} stroke={1.8} className="flex-shrink-0" />
                    ) : pending > 0 ? (
                        <IconCloudUpload size={14} stroke={1.8} className="flex-shrink-0" />
                    ) : (
                        <IconPhoto size={14} stroke={1.8} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{buildLabel()}</span>
                </div>
                {!running && (
                    <span className="text-[11px] underline font-medium flex-shrink-0">
                        {failed > 0 ? 'Resoudre' : 'Reessayer'}
                    </span>
                )}
            </button>
            <SyncConflictDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}
