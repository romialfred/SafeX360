import axiosInstance from "../interceptors/AxiosInterceptor";

/**
 * Analyse causale STRUCTURÉE d'un incident (ISO 45001 §10.2 a-b).
 *
 * Réutilise le modèle de causes persisté partagé avec le module Erreurs
 * (mêmes enums CausalMethod / CauseLevel), rattaché ici à un incident. Chaque
 * méthode (5 pourquoi, Ishikawa, arbre, ICAM) = une analyse portant N causes
 * hiérarchisées (niveau + catégorie + parent) — persistées, plus aplaties.
 * companyId est auto-injecté par l'intercepteur (dérivé/vérifié via l'incident).
 */

export type CausalMethod = 'FIVE_WHYS' | 'ISHIKAWA' | 'CAUSE_TREE' | 'ICAM';
export type CauseLevel = 'IMMEDIATE' | 'ROOT' | 'SYSTEMIC';

export interface CausalAnalysisDTO {
    id?: number | null;
    incidentId?: number | null;
    errorEventId?: number | null;
    method: CausalMethod;
    summary?: string | null;
    conductedBy?: number | null;
    conductedAt?: string | null;
}

export interface CauseDTO {
    id?: number | null;
    causalAnalysisId?: number | null;
    label: string;
    level?: CauseLevel | null;
    category?: string | null;
    parentCauseId?: number | null;
    /** Cause = contrôle/barrière défaillant(e) (ISO 45001 §10.2 a-b · ICAM). */
    failedControl?: boolean | null;
}

const base = "/hns/incident-cause";

const listAnalyses = async (incidentId: number): Promise<CausalAnalysisDTO[]> => {
    const res = await axiosInstance.get(`${base}/incidents/${incidentId}/analyses`);
    return res.data ?? [];
};

const addAnalysis = async (incidentId: number, dto: CausalAnalysisDTO): Promise<CausalAnalysisDTO> => {
    const res = await axiosInstance.post(`${base}/incidents/${incidentId}/analyses`, dto);
    return res.data;
};

/** Toutes les causes d'un incident, toutes analyses confondues (agrégation / picker action). */
const listCausesByIncident = async (incidentId: number): Promise<CauseDTO[]> => {
    const res = await axiosInstance.get(`${base}/incidents/${incidentId}/causes`);
    return res.data ?? [];
};

const listCauses = async (analysisId: number): Promise<CauseDTO[]> => {
    const res = await axiosInstance.get(`${base}/analyses/${analysisId}/causes`);
    return res.data ?? [];
};

const addCause = async (analysisId: number, dto: CauseDTO): Promise<CauseDTO> => {
    const res = await axiosInstance.post(`${base}/analyses/${analysisId}/causes`, dto);
    return res.data;
};

const deleteCause = async (causeId: number): Promise<void> => {
    await axiosInstance.delete(`${base}/causes/${causeId}`);
};

export { listAnalyses, addAnalysis, listCausesByIncident, listCauses, addCause, deleteCause };
