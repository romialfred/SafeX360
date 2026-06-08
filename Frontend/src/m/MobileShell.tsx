/**
 * MobileShell — Conteneur racine de la version mobile SafeX 360 Field.
 *
 * Structure :
 *   ┌──────────────────────────┐
 *   │  TopBar (selon ecran)    │  <- propre a chaque page
 *   ├──────────────────────────┤
 *   │                          │
 *   │  Outlet (page courante)  │  <- scrollable, padding bottom 80
 *   │                          │
 *   ├──────────────────────────┤
 *   │  BottomNav (5 items)     │  <- fixed, safe area inset
 *   └──────────────────────────┘
 *
 * Garanties :
 *   - Couleur de fond cream constante (#FAF8F3)
 *   - Pas de scroll horizontal possible
 *   - Safe areas respectees (notch + barre gestuelle)
 *   - Si Capacitor actif : status bar coloree dynamiquement par ecran
 *   - Indicateur reseau global (banner amber si offline)
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import MobileBottomNav from './components/MobileBottomNav';
import SyncIndicator from './components/SyncIndicator';
import AppUpdateBanner from './components/AppUpdateBanner';
import PullToRefresh from './components/PullToRefresh';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { IconWifiOff } from '@tabler/icons-react';
import { syncEngine } from './offline/syncEngine';

export default function MobileShell() {
    const { online, ready } = useNetworkStatus();

    // Demarre le sync engine une seule fois pour toute la session mobile.
    useEffect(() => {
        syncEngine.start();
        return () => syncEngine.stop();
    }, []);

    const handleRefresh = async () => {
        // Pull-to-refresh : relance le sync + ping la route courante en arriere-plan
        await syncEngine.run();
    };
    return (
        <div
            className="min-h-screen bg-[#FAF8F3] flex flex-col"
            style={{ overscrollBehaviorX: 'none' }}
        >
            {/* Banner offline global (uniquement quand la detection a abouti) */}
            {ready && !online && (
                <div
                    className="bg-amber-600 text-white text-[12px] px-3 py-1.5 flex items-center justify-center gap-2"
                    style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
                    role="status"
                >
                    <IconWifiOff size={13} stroke={2} />
                    <span>Mode hors ligne — vos saisies seront envoyées au retour du réseau.</span>
                </div>
            )}

            {/* Bandeau "Nouvelle version disponible" (Phase M6) */}
            <AppUpdateBanner />

            {/* Indicateur de synchronisation (X actions en attente) */}
            <SyncIndicator />

            <main
                className="flex-1 overflow-y-auto"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 80px)',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <PullToRefresh onRefresh={handleRefresh}>
                    <Outlet />
                </PullToRefresh>
            </main>

            <MobileBottomNav />
        </div>
    );
}
