import axiosInstance from '../interceptors/AxiosInterceptor';

/**
 * AIInspectionService — Assistance IA du module Inspections (LOT 50).
 *
 * Trois appels backend (/hns/ai-inspections/*) :
 *  - getAIInspectionStatus : la clé Anthropic est-elle configurée ?
 *  - analyzeInspectionPhoto : photo terrain → propositions de constats
 *  - reviewInspectionReport : rapport complet → relecture critique
 *
 * Contrat : l'IA PROPOSE, l'inspecteur DISPOSE. Aucune écriture en base par
 * ces endpoints ; les propositions pré-remplissent le formulaire d'exécution
 * existant et passent par les endpoints workflow habituels.
 */

export interface AIInspectionStatus {
    configured: boolean;
    model: string;
    provider: string;
    fallback: string;
}

export interface AICheckpointProposal {
    checkpointId: number;
    checkpointLabel: string;
    observable: boolean;
    proposedRawValue?: string | null;
    proposedConformity?: 'CONFORM' | 'WATCH' | 'NON_CONFORM' | 'NOT_APPLICABLE' | null;
    observation: string;
    confidence: number;
}

export interface AIInspectionAnalysisResponse {
    relevant: boolean;
    irrelevanceReason?: string | null;
    confidence: number;
    overallObservations: string;
    detectedIssues: string[];
    proposals: AICheckpointProposal[];
    suggestedSummary?: string | null;
    fromMock: boolean;
    aiModel: string;
    durationMs: number;
}

export interface AIRecommendedAction {
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    action: string;
    deadline: string;
    category: string;
}

export interface AIInspectionReviewResponse {
    qualityScore: number;
    verdict: string;
    strengths: string[];
    gaps: string[];
    underCoveredRisks: string[];
    improvements: string[];
    recommendedActions: AIRecommendedAction[];
    isoClauses: string[];
    improvedSummary?: string | null;
    fromMock: boolean;
    aiModel: string;
    durationMs: number;
}

export const getAIInspectionStatus = async (): Promise<AIInspectionStatus> => {
    const res = await axiosInstance.get('/hns/ai-inspections/status');
    return res.data;
};

export const analyzeInspectionPhoto = async (
    inspectionId: number,
    image: File,
    options?: { zoneLabel?: string; language?: 'fr' | 'en' },
): Promise<AIInspectionAnalysisResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    if (options?.zoneLabel) formData.append('zoneLabel', options.zoneLabel);
    formData.append('language', options?.language ?? 'fr');

    const res = await axiosInstance.post(
        `/hns/ai-inspections/${inspectionId}/analyze-photo`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // analyse vision : jusqu'à 2 min
        },
    );
    return res.data;
};

export const reviewInspectionReport = async (
    inspectionId: number,
    language: 'fr' | 'en' = 'fr',
): Promise<AIInspectionReviewResponse> => {
    const res = await axiosInstance.post(
        `/hns/ai-inspections/${inspectionId}/review-report`,
        null,
        {
            params: { language },
            timeout: 120000,
        },
    );
    return res.data;
};
