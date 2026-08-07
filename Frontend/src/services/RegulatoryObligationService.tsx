import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Registre des obligations réglementaires & code minier (cloisonné par mine).
 * `companyId` injecté automatiquement par l'intercepteur Axios.
 */

export interface OblMedia { name: string; type: string; file: string }

export interface RegulatoryObligation {
    id?: number;
    companyId?: number | null;
    category?: string;
    reference?: string;
    title?: string;
    article?: string | null;
    domain?: string | null;
    authority?: string | null;
    description?: string | null;
    complianceStatus?: string | null;
    actionRequired?: string | null;
    applicableSince?: string | null;
    lastReviewDate?: string | null;
    nextReviewDate?: string | null;
    responsibleEmployeeId?: number | null;
    mediaId?: number | null;
    mediaName?: string | null;
    media?: OblMedia | null;
    notes?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
    conformity?: string;
    reviewOverdue?: boolean;
    daysToReview?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

const BASE = '/hns/regulatory-obligation';

export const getAllObligations = (): Promise<RegulatoryObligation[]> =>
    axiosInstance.get(`${BASE}/getAll`).then((r) => r.data ?? []);

export const getObligationById = (id: number): Promise<RegulatoryObligation> =>
    axiosInstance.get(`${BASE}/get/${id}`).then((r) => r.data);

export const createObligation = (payload: RegulatoryObligation): Promise<number> =>
    axiosInstance.post(`${BASE}/create`, payload).then((r) => r.data);

export const updateObligation = (payload: RegulatoryObligation): Promise<void> =>
    axiosInstance.put(`${BASE}/update`, payload).then((r) => r.data);

export const activateObligation = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/activate/${id}`).then((r) => r.data);

export const deactivateObligation = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/deactivate/${id}`).then((r) => r.data);
