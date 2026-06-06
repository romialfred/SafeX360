import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Client API Tableau de bord Emergency (LOT 48 Phase 5).
 */

export interface TopReasonEntry {
    reasonCode: string;
    count: number;
}

export interface DailyCountEntry {
    date: string; // 'YYYY-MM-DD'
    count: number;
}

export interface TopActorEntry {
    actorId: number;
    actorName?: string | null;
    count: number;
}

export interface SosLocationEntry {
    id: number;
    latitude: number;
    longitude: number;
    status: string;
    reasonCode?: string | null;
    triggeredAt?: string | null;
}

export interface EmergencyDashboardDTO {
    companyId: number;
    windowDays: number;

    sosTotal: number;
    sosActive: number;
    sosClosed: number;
    sosFalseAlarm: number;
    sosClosedReal: number;
    sosAvgResolutionSeconds: number;
    sosAvgAckSeconds: number;

    generalAlertsTotal: number;
    generalAlertsActive: number;
    generalAlertsDrills: number;
    generalAlertsReal: number;
    generalAlertAvgDurationSeconds: number;

    topReasonsSos: TopReasonEntry[];
    sosByStatus: Record<string, number>;
    sosDailyCounts: DailyCountEntry[];
    generalAlertDailyCounts: DailyCountEntry[];
    topCoordinators: TopActorEntry[];
    recentSosLocations: SosLocationEntry[];

    generatedAt: string;
}

export const getEmergencyDashboardSummary = (
    companyId: number,
    windowDays = 7
): Promise<EmergencyDashboardDTO> =>
    axiosInstance
        .get('/hns/emergency/dashboard/summary', { params: { companyId, windowDays } })
        .then((r) => r.data);
