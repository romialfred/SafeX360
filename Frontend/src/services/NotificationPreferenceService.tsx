/**
 * NotificationPreferenceService — Preferences de reception des alertes
 * DANS L'APPLICATION (backend HNS, table `notification_preference`).
 *
 * Perimetre volontairement etroit : la plateforme ne diffuse les alertes que
 * par WebSocket STOMP (aucun emetteur email, SMS ou push n'existe). Le canal
 * n'est donc pas un parametre — le serveur impose la constante « WEB ».
 *
 * Scoping mine : l'intercepteur Axios injecte automatiquement `?companyId=` —
 * on ne le passe JAMAIS ici (aligne sur IndicatorService / EquipmentService).
 * En revanche `userId` est explicite : une preference appartient a une personne.
 *
 * Contrat backend (fige) :
 *   GET /hns/notification-preference/my?userId=      -> les 5 types (defaut actif)
 *   PUT /hns/notification-preference/update?userId=  -> body {eventType, enabled}
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

const BASE = '/hns/notification-preference';

/** Types d'evenement realement diffuses par la plateforme (miroir de l'enum Java). */
export type NotificationEventType = 'SOS' | 'GENERAL_ALERT' | 'BLAST' | 'ESCALATION' | 'MISFIRE';

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
    'SOS',
    'GENERAL_ALERT',
    'BLAST',
    'ESCALATION',
    'MISFIRE',
];

/** Libelles FR des types d'evenement (affichage ecran + coherence des textes). */
export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
    SOS: 'Alerte SOS',
    GENERAL_ALERT: 'Alerte générale',
    BLAST: 'Tir de mine',
    ESCALATION: 'Escalade',
    MISFIRE: 'Raté de tir',
};

/** Descriptions courtes — dire ce que l'utilisateur cesse de recevoir s'il coupe. */
export const NOTIFICATION_EVENT_DESCRIPTIONS: Record<NotificationEventType, string> = {
    SOS: "Déclenchement d'un SOS individuel par un employé sur le terrain.",
    GENERAL_ALERT: "Alerte générale diffusée à l'ensemble de la mine (évacuation, danger).",
    BLAST: 'Annonce de tir de mine à venir (fenêtre de tir, zone d’exclusion).',
    ESCALATION: "Escalade d'un SOS resté sans prise en charge dans le délai.",
    MISFIRE: "Déclaration d'un raté de tir (charge non explosée).",
};

export interface NotificationPreferenceDTO {
    id?: number | null;
    userId?: number | null;
    channel?: string;
    eventType: NotificationEventType;
    enabled: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/**
 * Preferences de l'utilisateur. NE RATTRAPE PAS l'erreur : l'appelant doit
 * pouvoir distinguer « tout est coupe » de « je n'ai pas pu charger », ce qui
 * conditionne le repli fail-open cote consommateur d'alertes.
 */
export const getMyPreferences = (userId: number): Promise<NotificationPreferenceDTO[]> =>
    axiosInstance
        .get<NotificationPreferenceDTO[]>(`${BASE}/my`, { params: { userId } })
        .then((r) => r.data ?? []);

export const updatePreference = (
    userId: number,
    eventType: NotificationEventType,
    enabled: boolean
) =>
    axiosInstance
        .put(`${BASE}/update`, { eventType, enabled }, { params: { userId } })
        .then((r) => r.data);
