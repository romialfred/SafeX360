import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API Alerte Générale + Évacuation Head-count (LOT 48 Phase 4).
 *
 * Base path : `/hns/emergency/alerts/general/*`.
 */

export type GeneralAlertStatus = 'ACTIVE' | 'ENDED';
export type CheckInStatus = 'SAFE' | 'INJURED' | 'MISSING';

export interface GeneralAlertDTO {
    id?: number;
    companyId: number;
    triggeredBy?: number;
    triggeredByName?: string | null;
    endedBy?: number | null;
    endedByName?: string | null;
    status: GeneralAlertStatus;
    reasonCode?: string | null;
    message?: string | null;
    drillMode?: boolean;
    triggeredAt?: string;
    endedAt?: string | null;
    elapsedSeconds?: number;
    totalEmployees?: number | null;
    checkedInCount?: number;
    safeCount?: number;
    injuredCount?: number;
    missingCount?: number;
}

export interface EvacuationCheckInDTO {
    id?: number;
    generalAlertId: number;
    employeeId: number;
    employeeName?: string | null;
    employeeDepartment?: string | null;
    employeePosition?: string | null;
    assemblyPointId?: number | null;
    assemblyPointName?: string | null;
    status: CheckInStatus;
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracy?: number | null;
    checkedBy?: number | null;
    note?: string | null;
    checkedAt?: string;
}

export interface GeneralAlertRequest {
    companyId: number;
    reasonCode?: string | null;
    message?: string | null;
    drillMode?: boolean;
}

// ── Lecture ─────────────────────────────────────────────────────────────────

export const getActiveAlert = (companyId: number): Promise<GeneralAlertDTO | null> =>
    axiosInstance
        .get('/hns/emergency/alerts/general/active', { params: { companyId } })
        .then((r) => r.data)
        .catch((err) => (err?.response?.status === 404 ? null : Promise.reject(err)));

export const listAlerts = (companyId: number): Promise<GeneralAlertDTO[]> =>
    axiosInstance
        .get('/hns/emergency/alerts/general', { params: { companyId } })
        .then((r) => r.data);

export const getAlert = (id: number): Promise<GeneralAlertDTO> =>
    axiosInstance.get(`/hns/emergency/alerts/general/${id}`).then((r) => r.data);

export const getAlertCheckIns = (id: number): Promise<EvacuationCheckInDTO[]> =>
    axiosInstance.get(`/hns/emergency/alerts/general/${id}/check-ins`).then((r) => r.data);

// ── Transitions ─────────────────────────────────────────────────────────────

export const triggerAlert = (req: GeneralAlertRequest, actorId?: number): Promise<GeneralAlertDTO> =>
    axiosInstance
        .post('/hns/emergency/alerts/general/trigger', req, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

export const endAlert = (id: number, actorId?: number): Promise<GeneralAlertDTO> =>
    axiosInstance
        .post(`/hns/emergency/alerts/general/${id}/end`, {}, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);

// ── Check-in ────────────────────────────────────────────────────────────────

export const checkInToAlert = (params: {
    alertId: number;
    employeeId: number;
    assemblyPointId?: number | null;
    status?: CheckInStatus;
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracy?: number | null;
    note?: string | null;
    actorId?: number;
}): Promise<EvacuationCheckInDTO> => {
    const { alertId, ...rest } = params;
    return axiosInstance
        .post(`/hns/emergency/alerts/general/${alertId}/check-in`, null, { params: rest })
        .then((r) => r.data);
};
