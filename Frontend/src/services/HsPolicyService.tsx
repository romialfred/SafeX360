import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * Politique SST (ISO 45001 §5.2 · §5.4). companyId (mine active) est auto-injecté
 * par l'intercepteur ; le serveur vérifie l'appartenance et l'autorité.
 *
 * Gouvernance : la gestion (brouillon, publication, statistiques) exige le rôle
 * management (403 sinon) ; la lecture de la politique en vigueur et la prise de
 * connaissance sont ouvertes à tout utilisateur authentifié.
 */

export type HsPolicyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface HsPolicyArticle {
    id?: number | null;
    orderIndex?: number | null;
    title?: string;
    body?: string;
    explanation?: string;
}

export interface HsPolicy {
    id?: number | null;
    companyId?: number | null;
    title?: string;
    preamble?: string;
    version?: number | null;
    status?: HsPolicyStatus;
    effectiveDate?: string | null;
    signatoryName?: string | null;
    signatoryTitle?: string | null;
    signedAt?: string | null;
    signatureImage?: string | null;
    attachmentName?: string | null;
    attachmentData?: string | null;
    articles?: HsPolicyArticle[];
    acknowledged?: boolean | null;
    acknowledgedAt?: string | null;
}

export interface HsPolicyAcknowledgement {
    id: number;
    accountId: number;
    empId?: number | null;
    name?: string | null;
    acknowledgedAt: string;
}

const base = '/hns/hs-policy';

/** Politique publiée courante ; null (204) si aucune n'est en vigueur. */
const getPublished = async (): Promise<HsPolicy | null> => {
    const r = await axiosInstance.get(base + '/published');
    return r.status === 204 ? null : (r.data as HsPolicy);
};

const acknowledge = (id: number, name?: string): Promise<HsPolicy> =>
    axiosInstance.post(`${base}/${id}/acknowledge`, { name }).then((r) => r.data);

// ── Management ──
const listPolicies = (): Promise<HsPolicy[]> =>
    axiosInstance.get(base + '/list').then((r) => r.data);

const getPolicy = (id: number): Promise<HsPolicy> =>
    axiosInstance.get(`${base}/${id}`).then((r) => r.data);

const saveDraft = (policy: HsPolicy): Promise<HsPolicy> =>
    axiosInstance.post(base + '/save', policy).then((r) => r.data);

const deleteDraft = (id: number) =>
    axiosInstance.delete(`${base}/${id}`).then((r) => r.data);

const publish = (
    id: number,
    payload: { signatoryName: string; signatoryTitle?: string; signatureImage?: string },
): Promise<HsPolicy> =>
    axiosInstance.post(`${base}/${id}/publish`, payload).then((r) => r.data);

const getAcknowledgements = (id: number): Promise<HsPolicyAcknowledgement[]> =>
    axiosInstance.get(`${base}/${id}/acknowledgements`).then((r) => r.data);

const getAcknowledgementStats = (id: number): Promise<{ acknowledged: number }> =>
    axiosInstance.get(`${base}/${id}/acknowledgement-stats`).then((r) => r.data);

export {
    getPublished,
    acknowledge,
    listPolicies,
    getPolicy,
    saveDraft,
    deleteDraft,
    publish,
    getAcknowledgements,
    getAcknowledgementStats,
};
