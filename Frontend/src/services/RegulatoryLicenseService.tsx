import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Registre des licences & permis d'exploitation (cloisonné par mine).
 * `companyId` est injecté automatiquement par l'intercepteur Axios (mine active).
 */

export interface LicenseMedia {
    name: string;
    type: string;
    /** Contenu base64 (sans préfixe data:). */
    file: string;
}

export interface License {
    id?: number;
    companyId?: number | null;
    licenseType?: string;
    reference?: string;
    title?: string;
    issuingAuthority?: string;
    holder?: string;
    issueDate?: string | null;
    effectiveDate?: string | null;
    expiryDate?: string | null;
    renewalDeadline?: string | null;
    areaHectares?: number | null;
    perimeter?: string | null;
    feeAmount?: number | null;
    responsibleEmployeeId?: number | null;
    mediaId?: number | null;
    mediaName?: string | null;
    /** Écriture seule : nouvelle pièce jointe à téléverser. */
    media?: LicenseMedia | null;
    notes?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
    /** Lecture seule (calculé serveur). */
    conformity?: string;
    daysToExpiry?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

const BASE = '/hns/exploitation-license';

export const getAllLicenses = (): Promise<License[]> =>
    axiosInstance.get(`${BASE}/getAll`).then((r) => r.data ?? []);

export const getLicenseById = (id: number): Promise<License> =>
    axiosInstance.get(`${BASE}/get/${id}`).then((r) => r.data);

export const createLicense = (payload: License): Promise<number> =>
    axiosInstance.post(`${BASE}/create`, payload).then((r) => r.data);

export const updateLicense = (payload: License): Promise<void> =>
    axiosInstance.put(`${BASE}/update`, payload).then((r) => r.data);

export const activateLicense = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/activate/${id}`).then((r) => r.data);

export const deactivateLicense = (id: number): Promise<void> =>
    axiosInstance.put(`${BASE}/deactivate/${id}`).then((r) => r.data);
