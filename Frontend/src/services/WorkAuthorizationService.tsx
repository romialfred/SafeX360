import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Registre des autorisations de travaux (cloisonné par mine).
 * `companyId` injecté automatiquement par l'intercepteur Axios.
 */

export interface AuthMedia { name: string; type: string; file: string }

export interface WorkAuthorization {
    id?: number;
    companyId?: number | null;
    authorizationType?: string;
    reference?: string;
    title?: string;
    zone?: string | null;
    requestedByEmployeeId?: number | null;
    approvedByEmployeeId?: number | null;
    issueDate?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
    riskLevel?: string | null;
    precautions?: string | null;
    mediaId?: number | null;
    mediaName?: string | null;
    media?: AuthMedia | null;
    notes?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
    conformity?: string;
    daysToEnd?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

const BASE = '/hns/work-authorization';

export const getAllAuthorizations = (): Promise<WorkAuthorization[]> =>
    axiosInstance.get(`${BASE}/getAll`).then((r) => r.data ?? []);

export const getAuthorizationById = (id: number): Promise<WorkAuthorization> =>
    axiosInstance.get(`${BASE}/get/${id}`).then((r) => r.data);

export const createAuthorization = (payload: WorkAuthorization): Promise<number> =>
    axiosInstance.post(`${BASE}/create`, payload).then((r) => r.data);

export const updateAuthorization = (payload: WorkAuthorization): Promise<void> =>
    axiosInstance.put(`${BASE}/update`, payload).then((r) => r.data);

export const closeAuthorization = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/close/${id}`).then((r) => r.data);

export const reopenAuthorization = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/reopen/${id}`).then((r) => r.data);
