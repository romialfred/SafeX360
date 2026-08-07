import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Registre des inspections réglementaires d'équipements (cloisonné par mine).
 * `companyId` injecté automatiquement par l'intercepteur Axios.
 */

export interface InspMedia { name: string; type: string; file: string }

export interface MandatoryInspection {
    id?: number;
    companyId?: number | null;
    equipmentType?: string;
    equipmentRef?: string | null;
    title?: string;
    inspectionType?: string;
    inspectionBody?: string | null;
    frequencyMonths?: number | null;
    lastInspectionDate?: string | null;
    nextInspectionDate?: string | null;
    result?: string | null;
    certificateNumber?: string | null;
    responsibleEmployeeId?: number | null;
    mediaId?: number | null;
    mediaName?: string | null;
    media?: InspMedia | null;
    notes?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
    conformity?: string;
    daysToNext?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

const BASE = '/hns/mandatory-inspection';

export const getAllInspections = (): Promise<MandatoryInspection[]> =>
    axiosInstance.get(`${BASE}/getAll`).then((r) => r.data ?? []);

export const getInspectionById = (id: number): Promise<MandatoryInspection> =>
    axiosInstance.get(`${BASE}/get/${id}`).then((r) => r.data);

export const createInspection = (payload: MandatoryInspection): Promise<number> =>
    axiosInstance.post(`${BASE}/create`, payload).then((r) => r.data);

export const updateInspection = (payload: MandatoryInspection): Promise<void> =>
    axiosInstance.put(`${BASE}/update`, payload).then((r) => r.data);

export const activateInspection = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/activate/${id}`).then((r) => r.data);

export const deactivateInspection = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/deactivate/${id}`).then((r) => r.data);
