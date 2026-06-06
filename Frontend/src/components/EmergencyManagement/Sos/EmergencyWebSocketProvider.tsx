import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAppSelector } from '../../../slices/hooks';
import type { SosAlertDTO } from '../../../services/SosService';
import type { GeneralAlertDTO } from '../../../services/GeneralAlertService';

/**
 * Provider WebSocket STOMP global pour la plateforme Emergency (LOT 48 Phase 3.b).
 *
 * <p>Établit une connexion SockJS+STOMP vers le backend Health-Safety
 * (endpoint {@code /ws/emergency}) avec auto-reconnect 5s. S'abonne au topic
 * {@code /topic/emergency/sos/company/{selectedCompanyId}} et expose un mécanisme
 * de listeners enregistrables côté composants enfants.</p>
 *
 * <p>Pattern : context React + listener registry. Plusieurs composants peuvent
 * écouter les messages sans dupliquer la connexion.</p>
 *
 * <p>L'URL backend est dérivée de {@code VITE_API_URL} (gateway) ; si gateway
 * est sur {@code :9000}, on utilise plutôt le port HS direct {@code :8081} pour
 * SockJS qui ne passe pas par le filtre TokenFilter du gateway.</p>
 */

type AlertListener = (alert: SosAlertDTO) => void;
type GeneralAlertListener = (alert: GeneralAlertDTO) => void;

interface EmergencyWebSocketContextValue {
    connected: boolean;
    subscribe: (listener: AlertListener) => () => void;
    subscribeGeneralAlert: (listener: GeneralAlertListener) => () => void;
}

const EmergencyWebSocketContext = createContext<EmergencyWebSocketContextValue>({
    connected: false,
    subscribe: () => () => {},
    subscribeGeneralAlert: () => () => {},
});

export const useEmergencyWebSocket = () => useContext(EmergencyWebSocketContext);

interface Props {
    children: ReactNode;
}

/** Résolution de l'URL WebSocket HS (par défaut localhost:8081, sinon variable env dédiée). */
const resolveWsBaseUrl = (): string => {
    const envBase = (import.meta as any).env?.VITE_HS_WS_URL as string | undefined;
    if (envBase) return envBase.replace(/\/+$/, '');
    // Heuristique : si on est en localhost, viser HS direct (8081)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:8081/hns';
    }
    // Prod : passer par gateway (le sock-js sera proxifié si tout va bien)
    return 'https://safex360-gateway.onrender.com/hns';
};

export const EmergencyWebSocketProvider = ({ children }: Props) => {
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const listenersRef = useRef<Set<AlertListener>>(new Set());
    const generalListenersRef = useRef<Set<GeneralAlertListener>>(new Set());

    // Fonction subscribe stable (n'oblige pas les enfants à re-render)
    const subscribe = useCallback((listener: AlertListener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    const subscribeGeneralAlert = useCallback((listener: GeneralAlertListener) => {
        generalListenersRef.current.add(listener);
        return () => {
            generalListenersRef.current.delete(listener);
        };
    }, []);

    useEffect(() => {
        if (!selectedCompanyId) return;

        const baseUrl = resolveWsBaseUrl();
        const wsUrl = `${baseUrl}/ws/emergency`;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 10_000,
            heartbeatOutgoing: 10_000,
            debug: () => {
                /* silencieux en prod ; activer pour debug */
            },
            onConnect: () => {
                setConnected(true);
                // SOS individuels
                client.subscribe(
                    `/topic/emergency/sos/company/${selectedCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            const payload: SosAlertDTO = JSON.parse(msg.body);
                            listenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
                // Alertes Générales (Phase 4)
                client.subscribe(
                    `/topic/emergency/alert/company/${selectedCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            const payload: GeneralAlertDTO = JSON.parse(msg.body);
                            generalListenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
            },
            onDisconnect: () => setConnected(false),
            onStompError: () => setConnected(false),
            onWebSocketClose: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate().catch(() => {});
            clientRef.current = null;
            setConnected(false);
        };
    }, [selectedCompanyId]);

    const value = useMemo(
        () => ({ connected, subscribe, subscribeGeneralAlert }),
        [connected, subscribe, subscribeGeneralAlert]
    );

    return (
        <EmergencyWebSocketContext.Provider value={value}>
            {children}
        </EmergencyWebSocketContext.Provider>
    );
};
