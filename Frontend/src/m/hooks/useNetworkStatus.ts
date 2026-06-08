/**
 * useNetworkStatus — Etat reseau temps reel.
 *
 * Surveille la connectivite via :
 *   - @capacitor/network (sur APK : Wi-Fi, cellular, none)
 *   - navigator.onLine (fallback navigateur web)
 *   - window 'online' / 'offline' events
 *
 * Renvoie { online, connectionType } reactifs. Utilise par le sync engine
 * pour declencher le replay de la queue au reconnect.
 */

import { useEffect, useState } from 'react';
import { getCapacitorPlugin } from '../utils/capacitorBridge';

type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';

export interface NetworkStatus {
    online: boolean;
    connectionType: ConnectionType;
    ready: boolean;
}

const INITIAL: NetworkStatus = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    ready: false,
};

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>(INITIAL);

    useEffect(() => {
        let cancelled = false;
        let removeListener: (() => void) | null = null;

        const onWebStatus = () => {
            if (cancelled) return;
            setStatus((s) => ({ ...s, online: navigator.onLine, ready: true }));
        };

        (async () => {
            try {
                const Network = getCapacitorPlugin<any>('Network');
                if (!Network || cancelled) {
                    // Fallback web
                    window.addEventListener('online', onWebStatus);
                    window.addEventListener('offline', onWebStatus);
                    onWebStatus();
                    return;
                }
                const current = await Network.getStatus();
                if (cancelled) return;
                setStatus({
                    online: current.connected,
                    connectionType: (current.connectionType as ConnectionType) || 'unknown',
                    ready: true,
                });
                const handle = await Network.addListener('networkStatusChange', (s: any) => {
                    setStatus({
                        online: s.connected,
                        connectionType: (s.connectionType as ConnectionType) || 'unknown',
                        ready: true,
                    });
                });
                removeListener = () => handle.remove();
            } catch {
                window.addEventListener('online', onWebStatus);
                window.addEventListener('offline', onWebStatus);
                onWebStatus();
            }
        })();

        return () => {
            cancelled = true;
            if (removeListener) removeListener();
            window.removeEventListener('online', onWebStatus);
            window.removeEventListener('offline', onWebStatus);
        };
    }, []);

    return status;
}
