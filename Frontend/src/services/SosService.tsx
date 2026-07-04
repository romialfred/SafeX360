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
    companyId: number;
    employeeId: number;
    employeeName?: string | null;
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
