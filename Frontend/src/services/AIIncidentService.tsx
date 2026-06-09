/**
 * AIIncidentService — Service d'appel au backend pour l'analyse IA d'incident.
 *
 * Endpoints :
 *   GET  /hns/ai-incidents/status     → vérifier configuration
 *   POST /hns/ai-incidents/analyze    → analyse multipart d'une image
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

export interface IdentifiedRisk {
    risk: string;
    gravity: number;
    probability: number;
    criticality?: number;
}

export interface CorrectiveAction {
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    action: string;
    deadline: string;
    category: 'ELIMINATION' | 'SUBSTITUTION' | 'ENGINEERING' | 'ADMINISTRATIVE' | 'PPE';
}

export interface AIAnalysisResponse {
    hseRelevant: boolean;
    irrelevanceReason?: string;
    confidence: number;
    incidentType: 'ACCIDENT' | 'QUASI_ACCIDENT' | 'DANGER' | 'NON_CONFORMITY' | 'NEAR_MISS';
    category: 'FALL_FROM_HEIGHT' | 'ELECTRICAL' | 'CHEMICAL' | 'FIRE' | 'MECHANICAL' | 'EPI_MISSING' | 'ENVIRONMENT' | 'OTHER';
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    identifiedRisks: IdentifiedRisk[];
    rootCauseHypothesis?: string;
    isoClauses: string[];
    correctiveActions: CorrectiveAction[];
    remediationPlan?: string;
    fromMock: boolean;
    aiModel: string;
    durationMs: number;
}

export interface AIStatus {
    configured: boolean;
    model: string;
    provider: string;
    fallback: string;
}

/** Indique si la clé API IA est configurée côté backend. */
export const getAIStatus = async (): Promise<AIStatus> => {
    const res = await axiosInstance.get('/hns/ai-incidents/status');
    return res.data;
};

/**
 * Analyse une image HSE avec l'IA.
 * @param image Fichier image (jpg/png/webp/gif, max 10 MB)
 * @param context Contexte optionnel (mine, département, commentaire libre)
 */
export const analyzeImage = async (
    image: File,
    context?: {
        mineContext?: string;
        departmentContext?: string;
        userContext?: string;
        language?: 'fr' | 'en';
    },
): Promise<AIAnalysisResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    if (context?.mineContext) formData.append('mineContext', context.mineContext);
    if (context?.departmentContext) formData.append('departmentContext', context.departmentContext);
    if (context?.userContext) formData.append('userContext', context.userContext);
    formData.append('language', context?.language ?? 'fr');

    const res = await axiosInstance.post('/hns/ai-incidents/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s pour analyse IA
    });

    return res.data;
};
