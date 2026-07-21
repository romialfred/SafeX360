import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API SOS Lifecycle (LOT 48 Phase 3).
 *
 * Base path : `/hns/emergency/sos/*`.
 */

export type SosStatus =
    | 'RECEIVED'
    | 'ACKNOWLEDGED'
    | 'DISPATCHED'
    | 'ON_SITE'
    | 'CLOSED'
    | 'FALSE_ALARM';

export interface SosAlertDTO {
    id?: number;
    /** Clé générée côté client pour rendre les rejeux réseau idempotents. */
    clientRequestId?: string;
    companyId: number;
    employeeId: number;
    employeeName?: string | null;
    employeePhone?: string | null;
    coordinatorId?: number | null;
    coordinatorName?: string | null;
    rescueTeamId?: number | null;
    rescueTeamName?: string | null;
    reasonCode?: string | null;
    description?: string | null;
    latitude: number;
    longitude: number;
    gpsAccuracy?: number | null;
    status: SosStatus;
    drillMode?: boolean;
    falseAlarmReason?: string | null;
    triggeredAt?: string;
    acknowledgedAt?: string | null;
    dispatchedAt?: string | null;
    onSiteAt?: string | null;
    closedAt?: string | null;
    elapsedSeconds?: number;
}

export interface SosLifecycleEventDTO {
    id?: number;
    sosAlertId: number;
    statusTo: SosStatus;
    statusFrom?: SosStatus | null;
    actorId?: number | null;
    actorName?: string | null;
    note?: string | null;
    createdAt?: string;
}

export interface SosTransitionRequest {
    rescueTeamId?: number | null;
    note?: string | null;
    falseAlarmReason?: string | null;
}

/**
 * Message du fil de communication d'un SOS (console d'intervention).
 *
 * <p>`senderType` distingue la parole du coordinateur (bulle droite), du
 * concerné/victime (bulle gauche) et les jalons système (au centre).</p>
 */
export interface SosMessageDTO {
    id: number;
    sosAlertId: number;
    senderType: 'COORDINATOR' | 'VICTIM' | 'SYSTEM';
    senderId?: number | null;
    senderName?: string | null;
    body: string;
    createdAt: string;
}

// ── Lecture ─────────────────────────────────────────────────────────────────

export const listSosAlerts = (
    companyId: number,
    includeClosed = false
): Promise<SosAlertDTO[]> =>
    axiosInstance
        .get('/hns/emergency/sos', { params: { companyId, includeClosed } })
        .then((r) => r.data);

export const getActiveSosAlerts = (companyId: number): Promise<SosAlertDTO[]> =>
    listSosAlerts(companyId, false);

export const getSosAlert = (id: number): Promise<SosAlertDTO> =>
    axiosInstance.get(`/hns/emergency/sos/${id}`).then((r) => r.data);

export const getSosLifecycle = (id: number): Promise<SosLifecycleEventDTO[]> =>
    axiosInstance.get(`/hns/emergency/sos/${id}/lifecycle`).then((r) => r.data);

// ── Fil de communication (chat) ──────────────────────────────────────────────

/** Liste les messages du fil d'un SOS, triés par date croissante. */
export const listSosMessages = (id: number): Promise<SosMessageDTO[]> =>
    axiosInstance.get(`/hns/emergency/sos/${id}/messages`).then((r) => r.data);

/** Poste un message coordinateur dans le fil du SOS. */
export const postSosMessage = (
    id: number,
    body: string,
    actorId?: number,
    senderName?: string
): Promise<SosMessageDTO> =>
    axiosInstance
        .post(
            `/hns/emergency/sos/${id}/messages`,
            { body, senderType: 'COORDINATOR', senderName },
            { params: actorId !== undefined ? { actorId } : {} }
        )
        .then((r) => r.data);

// ── Création ────────────────────────────────────────────────────────────────

export const createSosAlert = (
    dto: SosAlertDTO,
    actorId?: number
): Promise<SosAlertDTO> =>
    axiosInstance
        .post('/hns/emergency/sos', dto, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

// ── Transitions ─────────────────────────────────────────────────────────────

const transition = (action: string) => (
    id: number,
    req?: SosTransitionRequest,
    actorId?: number
): Promise<SosAlertDTO> =>
    axiosInstance
        .post(`/hns/emergency/sos/${id}/${action}`, req ?? {}, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const acknowledgeSosAlert = transition('acknowledge');
export const dispatchSosAlert = transition('dispatch');
export const onSiteSosAlert = transition('on-site');
export const closeSosAlert = transition('close');
export const falseAlarmSosAlert = transition('false-alarm');
