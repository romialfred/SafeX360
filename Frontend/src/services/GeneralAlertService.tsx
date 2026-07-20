import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API Alerte Générale + Évacuation Head-count (LOT 48 Phase 4).
 *
 * Base path : `/hns/emergency/alerts/general/*`.
 */

export type GeneralAlertStatus = 'ACTIVE' | 'ENDED';
/**
 * Statut d'un employé à l'appel nominatif.
 *
 * ATTENTION : « pas encore pointé » ne fait PAS partie de cette énumération —
 * c'est l'absence de check-in. Un employé sans check-in reste à vérifier ; le
 * confondre avec MISSING (absence constatée) masquerait des personnes que
 * personne n'a cherchées.
 */
export type CheckInStatus = 'SAFE' | 'INJURED' | 'MISSING' | 'NOT_APPLICABLE';

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
    /** Employés explicitement écartés de l'évacuation (congé, hors site). */
    notApplicableCount?: number;
    /** Périmètre de zones : "ALL" ou "SELECTION". */
    zoneScope?: string | null;
    /** Zones ciblées (ids de Location) si SELECTION. */
    zoneIds?: number[] | null;
    /** Noms des zones ciblées, pour affichage. */
    zoneNames?: string[] | null;
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
    /** "ALL" (mine entière) ou "SELECTION" (zones précises). */
    zoneScope?: 'ALL' | 'SELECTION';
    /** Zones ciblées (ids de Location) quand zoneScope = "SELECTION". */
    zoneIds?: number[];
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

export interface BulkCheckInEntry {
    employeeId: number;
    status: CheckInStatus;
    note?: string | null;
    assemblyPointId?: number | null;
}

/**
 * Pointage EN LOT de l'appel nominatif : une requête pour N employés.
 *
 * Le centre de contrôle marque souvent une équipe entière d'un coup. En
 * unitaire cela ferait N requêtes et N diffusions WebSocket — inacceptable
 * pendant une évacuation.
 */
export const bulkCheckInToAlert = (params: {
    alertId: number;
    entries: BulkCheckInEntry[];
    assemblyPointId?: number | null;
    note?: string | null;
    actorId?: number;
}): Promise<EvacuationCheckInDTO[]> => {
    const { alertId, actorId, ...body } = params;
    return axiosInstance
        .post(`/hns/emergency/alerts/general/${alertId}/check-in/bulk`, body, {
            params: actorId !== undefined ? { actorId } : {},
        })
        .then((r) => r.data);
};
