import type { SosStatus } from '../services/SosService';

/** État de livraison visible par l'émetteur, distinct du cycle d'intervention. */
export type SosDeliveryState = 'QUEUED' | 'RECEIVED' | 'ACKNOWLEDGED' | 'FAILED';

export interface SosDeliveryNotice {
    title: string;
    body: string;
    tone: 'amber' | 'blue' | 'green' | 'red';
}

export const deriveSosDeliveryState = (
    online: boolean,
    serverStatus?: SosStatus,
): SosDeliveryState => {
    if (!online) return 'QUEUED';
    return serverStatus && serverStatus !== 'RECEIVED'
        ? 'ACKNOWLEDGED'
        : 'RECEIVED';
};

export const getSosDeliveryNotice = (
    state: SosDeliveryState,
    reasonLabel?: string,
): SosDeliveryNotice => {
    const reason = reasonLabel ? ` (${reasonLabel})` : '';
    switch (state) {
        case 'QUEUED':
            return {
                title: 'SOS enregistré — en attente de réseau',
                body: `Le SOS reste sur cet appareil et n'a pas encore été reçu par SafeX${reason}.`,
                tone: 'amber',
            };
        case 'RECEIVED':
            return {
                title: 'SOS reçu par SafeX',
                body: `Le serveur a enregistré le SOS. La prise en charge par un coordinateur n'est pas encore confirmée${reason}.`,
                tone: 'blue',
            };
        case 'ACKNOWLEDGED':
            return {
                title: 'SOS pris en charge',
                body: `Un coordinateur a acquitté le SOS${reason}.`,
                tone: 'green',
            };
        case 'FAILED':
            return {
                title: 'SOS non transmis',
                body: `Le SOS n'a été ni reçu par le serveur ni conservé dans la file locale${reason}.`,
                tone: 'red',
            };
    }
};

export const SOS_DEGRADED_GUIDANCE =
    "Sans confirmation de prise en charge, utilisez immédiatement les canaux du plan d'urgence du site : radio, téléphone ou alarme locale.";

export const createSosClientRequestId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `sos-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

