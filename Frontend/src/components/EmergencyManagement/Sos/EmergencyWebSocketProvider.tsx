import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAppSelector } from '../../../slices/hooks';
import type { SosAlertDTO } from '../../../services/SosService';
import type { GeneralAlertDTO } from '../../../services/GeneralAlertService';
import {
    getMyPreferences,
    type NotificationEventType,
} from '../../../services/NotificationPreferenceService';

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
type BlastPopupListener = (popup: BlastPopupPayload) => void;
type EscalationListener = (event: EscalationEvent) => void;
type MisfireListener = (event: BlastMisfirePayload) => void;

const SOS_SUBSCRIBER_ROLES = new Set([
    'SYSTEM_ADMINISTRATOR',
    'ADMINISTRATOR',
    'ADMIN',
    'HEALTH_SAFETY_COORDINATOR',
    'HSE_MANAGER',
    'HSE_OFFICER',
    'INCIDENT_INVESTIGATOR',
]);

/**
 * Payload d'une popup de tir diffusee par {@code BlastPopupBroadcaster}
 * (LOT Blast P4). Aligne sur la spec backend : tous les champs sont nullables
 * cote frontend pour rester defensif face a un payload tronque.
 */
export interface BlastPopupPayload {
    type?: 'BLAST_POPUP';
    blastId?: number | null;
    reference?: string | null;
    blastReference?: string | null;
    zone?: string | null;
    scheduledAt?: string | null;
    timeRemainingSeconds?: number | null;
    minutesToBlast?: number | null;
    language?: 'FR' | 'EN' | 'BILINGUAL' | null;
    mineId?: number | null;
    pit?: string | null;
    bench?: string | null;
    exclusionRadiusM?: number | null;
    assemblyPoints?: string | null;
    jobId?: number | null;
}

/**
 * Payload d'un evenement d'escalade diffuse par {@code SosEscalationScheduler}.
 * Tous les champs sont optionnels cote frontend pour rester defensif.
 */
export interface EscalationEvent {
    type?: string;
    sosAlertId?: number;
    employeeName?: string;
    reasonCode?: string;
    stepOrder?: number;
    targetPermission?: string;
    companyId?: number;
    message?: string;
}

/**
 * Payload d'un misfire de tir diffuse par {@code BlastMisfireBroadcaster}.
 * Aligne sur la spec backend ; tous les champs sont nullables cote frontend.
 */
export interface BlastMisfirePayload {
    type?: 'BLAST_MISFIRE';
    blastId?: number | null;
    reference?: string | null;
    zone?: string | null;
    scheduledAt?: string | null;
    mineId?: number | null;
    pit?: string | null;
    bench?: string | null;
    exclusionRadiusM?: number | null;
    reason?: string | null;
    declaredAt?: string | null;
    language?: 'FR' | 'EN' | 'BILINGUAL' | null;
}

interface EmergencyWebSocketContextValue {
    connected: boolean;
    subscribe: (listener: AlertListener) => () => void;
    subscribeGeneralAlert: (listener: GeneralAlertListener) => () => void;
    /**
     * Abonne un listener aux popups de tir. Renvoie une fonction de
     * desabonnement a appeler dans le {@code useEffect} cleanup.
     *
     * <p>Le provider s'abonne au topic {@code /topic/blast-popup} (broadcast
     * a tous les utilisateurs connectes, conforme a la spec P4 « envoie a
     * tous les utilisateurs connectes »).
     */
    subscribeBlastPopup: (listener: BlastPopupListener) => () => void;
    /** Abonne un listener aux evenements d'escalade SOS. */
    subscribeEscalation: (listener: EscalationListener) => () => void;
    /** Abonne un listener aux misfires de tir. */
    subscribeMisfire: (listener: MisfireListener) => () => void;
}

const EmergencyWebSocketContext = createContext<EmergencyWebSocketContextValue>({
    connected: false,
    subscribe: () => () => {},
    subscribeGeneralAlert: () => () => {},
    subscribeBlastPopup: () => () => {},
    subscribeEscalation: () => () => {},
    subscribeMisfire: () => () => {},
});

export const useEmergencyWebSocket = () => useContext(EmergencyWebSocketContext);

interface Props {
    children: ReactNode;
}

/** Résolution de l'URL WebSocket HS (par défaut localhost:8081, sinon variable env dédiée). */
const resolveWsBaseUrl = (): string => {
    const envBase = (import.meta as any).env?.VITE_HS_WS_URL as string | undefined;
    if (envBase) return envBase.replace(/\/+$/, '');
    // APK Capacitor : hostname vaut « localhost » MAIS il faut viser le
    // gateway de prod — sinon le WebSocket tentait le poste de dev (8081).
    const isNativeApp = typeof window !== 'undefined'
        && Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (isNativeApp) return 'https://safex360-gateway.onrender.com/hns';
    // Heuristique dev web : si on est en localhost, viser HS direct (8081)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:8081/hns';
    }
    // Prod web : passer par le MÊME ORIGINE (proxy Vercel `/hns/*` → gateway),
    // comme l'intercepteur Axios. Sinon le handshake SockJS (`/ws/emergency/info`)
    // partait en CROSS-ORIGIN vers onrender.com : le cookie `jwt` (first-party
    // data-univers.com, SameSite) n'était PAS envoyé → TokenFilter renvoyait 401
    // en boucle (toutes les 5 s) et AUCUN SOS/alerte n'arrivait. En same-origin,
    // le cookie accompagne les transports XHR de SockJS et le WS s'authentifie.
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/hns`;
    }
    return 'https://safex360-gateway.onrender.com/hns';
};

export const EmergencyWebSocketProvider = ({ children }: Props) => {
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    const user = useAppSelector((state: any) => state.user);
    // En « Vue consolidée » (Toutes les Mines), selectedCompanyId est null : il
    // FAUT quand même ouvrir le WebSocket, sinon aucun SOS/Alerte n'arrive jamais
    // (ni popup ni sirène). On retombe sur la mine d'attache de l'utilisateur —
    // EXACTEMENT la même résolution que l'émetteur SOS (SosButton.resolveCompanyId),
    // donc l'émetteur reçoit bien son propre broadcast.
    const effectiveCompanyId = Number(selectedCompanyId ?? user?.mineId ?? user?.companyId ?? 1);
    const canSubscribeSos = SOS_SUBSCRIBER_ROLES.has(
        String(user?.role ?? '').trim().toUpperCase(),
    );
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const listenersRef = useRef<Set<AlertListener>>(new Set());
    const generalListenersRef = useRef<Set<GeneralAlertListener>>(new Set());
    const blastListenersRef = useRef<Set<BlastPopupListener>>(new Set());
    const escalationListenersRef = useRef<Set<EscalationListener>>(new Set());
    const misfireListenersRef = useRef<Set<MisfireListener>>(new Set());

    /* ─────────────────────────────────────────────────────────────────────
     *  PRÉFÉRENCES DE NOTIFICATION (écran « Préférences de notification »)
     *
     *  L'utilisateur peut couper, par type d'événement, l'affichage des
     *  alertes DANS L'APPLICATION. C'est ici — et seulement ici — que ce
     *  réglage produit un effet : on filtre les messages STOMP AVANT de les
     *  remettre aux listeners (popups, sirène, toasts). Filtrer au plus près
     *  de la réception évite d'avoir à répéter la règle dans chaque écran.
     *
     *  FAIL-OPEN : `null` signifie « préférences pas encore chargées » (ou
     *  chargement en échec — API indisponible, réseau coupé, utilisateur
     *  inconnu). Dans ce cas on affiche TOUT. Masquer un SOS ou un raté de
     *  tir parce qu'un appel de configuration a échoué serait un risque de
     *  sécurité bien plus grave que d'afficher une alerte non désirée. Le
     *  défaut serveur est d'ailleurs le même (opt-out, pas opt-in).
     * ────────────────────────────────────────────────────────────────────*/
    const prefsRef = useRef<Record<NotificationEventType, boolean> | null>(null);
    const notificationUserId = Number(user?.empId ?? user?.id ?? 0) || null;

    /** Faut-il remettre cet événement aux listeners ? Fail-open si non chargé. */
    const isEventAllowed = useCallback((type: NotificationEventType): boolean => {
        const prefs = prefsRef.current;
        if (!prefs) return true; // fail-open : jamais de silence dû à une panne
        return prefs[type] !== false;
    }, []);

    useEffect(() => {
        if (!notificationUserId) {
            prefsRef.current = null; // pas d'utilisateur identifié → tout passe
            return;
        }
        let cancelled = false;
        getMyPreferences(notificationUserId)
            .then((rows) => {
                if (cancelled) return;
                const map: Record<NotificationEventType, boolean> = {
                    SOS: true,
                    GENERAL_ALERT: true,
                    BLAST: true,
                    ESCALATION: true,
                    MISFIRE: true,
                };
                rows.forEach((row) => {
                    if (row?.eventType && row.eventType in map) {
                        map[row.eventType] = row.enabled !== false;
                    }
                });
                prefsRef.current = map;
            })
            .catch(() => {
                // Échec de chargement → on reste en fail-open (voir bloc ci-dessus).
                if (!cancelled) prefsRef.current = null;
            });
        return () => {
            cancelled = true;
        };
        // Rechargé au changement de mine : les préférences sont par mine.
    }, [notificationUserId, effectiveCompanyId]);

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

    const subscribeBlastPopup = useCallback((listener: BlastPopupListener) => {
        blastListenersRef.current.add(listener);
        return () => {
            blastListenersRef.current.delete(listener);
        };
    }, []);

    const subscribeEscalation = useCallback((listener: EscalationListener) => {
        escalationListenersRef.current.add(listener);
        return () => {
            escalationListenersRef.current.delete(listener);
        };
    }, []);

    const subscribeMisfire = useCallback((listener: MisfireListener) => {
        misfireListenersRef.current.add(listener);
        return () => {
            misfireListenersRef.current.delete(listener);
        };
    }, []);

    useEffect(() => {
        if (!effectiveCompanyId) return;

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
                // SOS individuels : rôles HSE autorisés uniquement.
                if (canSubscribeSos) client.subscribe(
                    `/topic/emergency/sos/company/${effectiveCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            if (!isEventAllowed('SOS')) return; // préférence utilisateur
                            const payload: SosAlertDTO = JSON.parse(msg.body);
                            listenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
                // Alertes Générales (Phase 4)
                client.subscribe(
                    `/topic/emergency/alert/company/${effectiveCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            if (!isEventAllowed('GENERAL_ALERT')) return; // préférence utilisateur
                            const payload: GeneralAlertDTO = JSON.parse(msg.body);
                            generalListenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
                // LOT Blast P4 — Popups de tir (broadcast a tous + canal per-mine).
                // Le frontend ecoute les deux : si une mine est selectionnee, le
                // canal per-mine filtre naturellement ; sinon le broadcast global
                // assure que les admins / coordinateurs centralises soient
                // toujours notifies.
                client.subscribe(
                    `/topic/blast-popup/mine/${effectiveCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            if (!isEventAllowed('BLAST')) return; // préférence utilisateur
                            const payload: BlastPopupPayload = JSON.parse(msg.body);
                            blastListenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
                // Escalade SOS : même restriction de rôle que le canal SOS.
                if (canSubscribeSos) client.subscribe(
                    `/topic/emergency/escalation/company/${effectiveCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            if (!isEventAllowed('ESCALATION')) return; // préférence utilisateur
                            const payload: EscalationEvent = JSON.parse(msg.body);
                            escalationListenersRef.current.forEach((l) => {
                                try { l(payload); } catch { /* swallow */ }
                            });
                        } catch { /* non-JSON */ }
                    }
                );
                // Ratés de tir : canal strictement cloisonné par mine.
                client.subscribe(
                    `/topic/blast-misfire/mine/${effectiveCompanyId}`,
                    (msg: IMessage) => {
                        try {
                            if (!isEventAllowed('MISFIRE')) return; // préférence utilisateur
                            const payload: BlastMisfirePayload = JSON.parse(msg.body);
                            misfireListenersRef.current.forEach((l) => {
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
        // `isEventAllowed` est stable (useCallback sans dépendance) : l'ajouter ici
        // ne provoque aucune reconnexion, il lit `prefsRef` au moment du message.
    }, [effectiveCompanyId, canSubscribeSos, isEventAllowed]);

    const value = useMemo(
        () => ({ connected, subscribe, subscribeGeneralAlert, subscribeBlastPopup, subscribeEscalation, subscribeMisfire }),
        [connected, subscribe, subscribeGeneralAlert, subscribeBlastPopup, subscribeEscalation, subscribeMisfire]
    );

    return (
        <EmergencyWebSocketContext.Provider value={value}>
            {children}
        </EmergencyWebSocketContext.Provider>
    );
};
