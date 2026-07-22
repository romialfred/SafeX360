import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * Classification des lésions + indicateurs de fréquence (ISO 45001 §9.1.1).
 * companyId auto-injecté par l'intercepteur.
 */

export type InjuryOutcome = 'FATALITY' | 'LTI' | 'RWC' | 'MTC' | 'FAC' | 'NEAR_MISS';

export interface IncidentInjury {
    id?: number | null;
    incidentId?: number | null;
    employeeId?: number | null;
    personName?: string | null;
    employeeName?: string | null;
    outcome: InjuryOutcome;
    natureOfInjury?: string | null;
    bodyPart?: string | null;
    lostDays?: number | null;
}

export interface WorkedHours {
    id?: number | null;
    year: number;
    month: number;
    hours: number;
}

export interface MonthlyKpi {
    month: number;
    hoursWorked: number;
    ltiCount: number;
    recordableCount: number;
    lostDays: number;
    ltifr: number | null;
    trifr: number | null;
    severityRate: number | null;
}

export interface SafetyKpi {
    year: number;
    hoursWorked: number;
    fatalities: number;
    ltiCount: number;
    recordableCount: number;
    lostDays: number;
    ltifr: number | null;
    trifr: number | null;
    severityRate: number | null;
    outcomeBreakdown: Record<string, number>;
    monthly?: MonthlyKpi[];
}

export type LaborType = 'DEPARTMENT' | 'SUBCONTRACTOR';

export interface WorkedHoursEntry {
    id?: number | null;
    year: number;
    month: number;
    laborType?: LaborType;
    departmentId?: number | null;
    subcontractorName?: string | null;
    hours: number;
    departmentName?: string | null;
}

const base = "/hns/safety-metrics";

const listInjuries = async (incidentId: number | string): Promise<IncidentInjury[]> =>
    axiosInstance.get(`${base}/incidents/${incidentId}/injuries`).then((r) => r.data ?? []);

const addInjury = async (incidentId: number | string, dto: IncidentInjury): Promise<IncidentInjury> =>
    axiosInstance.post(`${base}/incidents/${incidentId}/injuries`, dto).then((r) => r.data);

const deleteInjury = async (injuryId: number | string): Promise<void> => {
    await axiosInstance.delete(`${base}/injuries/${injuryId}`);
};

const upsertWorkedHours = async (dto: WorkedHours): Promise<WorkedHours> =>
    axiosInstance.put(`${base}/worked-hours`, dto).then((r) => r.data);

const listWorkedHours = async (year: number): Promise<WorkedHours[]> =>
    axiosInstance.get(`${base}/worked-hours`, { params: { year } }).then((r) => r.data ?? []);

const getKpi = async (year: number): Promise<SafetyKpi> =>
    axiosInstance.get(`${base}/kpi`, { params: { year } }).then((r) => r.data);

// ── Heures travaillées DÉTAILLÉES (par département / sous-traitant) ──
const listWorkedHoursEntries = async (year: number): Promise<WorkedHoursEntry[]> =>
    axiosInstance.get(`${base}/worked-hours-entries`, { params: { year } }).then((r) => r.data ?? []);

const upsertWorkedHoursEntry = async (dto: WorkedHoursEntry): Promise<WorkedHoursEntry> =>
    axiosInstance.put(`${base}/worked-hours-entries`, dto).then((r) => r.data);

const deleteWorkedHoursEntry = async (entryId: number): Promise<void> => {
    await axiosInstance.delete(`${base}/worked-hours-entries/${entryId}`);
};

export {
    listInjuries, addInjury, deleteInjury, upsertWorkedHours, listWorkedHours, getKpi,
    listWorkedHoursEntries, upsertWorkedHoursEntry, deleteWorkedHoursEntry,
};
