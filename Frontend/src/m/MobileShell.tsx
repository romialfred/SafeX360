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

import { Outlet } from 'react-router-dom';
import MobileBottomNav from './components/MobileBottomNav';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { IconWifiOff } from '@tabler/icons-react';

export default function MobileShell() {
    const { online, ready } = useNetworkStatus();
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

            <main
                className="flex-1 overflow-y-auto"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 80px)',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <Outlet />
            </main>

            <MobileBottomNav />
        </div>
    );
}
