/**
 * ErrorManagementService — Service du module « Gestion des Erreurs » (SafeX 360).
 *
 * Branché sur l'API P2 du microservice Health-Safety (préfixe gateway /hns).
 * Chemins finaux : /hns/error/...
 *
 * IMPORTANT : l'intercepteur Axios global (AxiosInterceptor.tsx) injecte
 * automatiquement ?companyId=… sur CHAQUE requête. Ce service ne doit donc
 * JAMAIS ajouter companyId manuellement.
 *
 * Endpoints couverts :
 *  - Événements : list / get / create / updateStatus / history
 *  - Classification (taxonomie de Reason) : get / upsert
 *  - Analyses causales : list / add
 *  - Causes : list / add / delete
 *  - Culture juste (Just Culture) : get / upsert
 *  - KPI : computeKpis
 *  - Référentiels : event-types / severities / probabilities / criticality-matrix
 */

import axiosInstance from '../interceptors/AxiosInterceptor';

/** Délai borné pour les lectures du registre : l'interface doit pouvoir proposer une reprise. */
export const ERROR_MANAGEMENT_READ_TIMEOUT_MS = 15_000;

// ─────────────────────────────────────────────────────────────────────────
//  ENUMS (alignés EXACTEMENT sur le backend)
// ─────────────────────────────────────────────────────────────────────────

export type ErrorEventStatus =
    | 'DECLARED'
    | 'TRIAGED'
    | 'ANALYZING'
    | 'ACTION_PLAN'
    | 'IMPLEMENTING'
    | 'VERIFYING'
    | 'CLOSED'
    | 'CAPITALIZED'
    | 'REOPENED';

export type ErrorSourceModule = 'MANUAL' | 'EMERGENCY' | 'BLAST' | 'DOSIMETRY';

export type CausalMethod = 'FIVE_WHYS' | 'ISHIKAWA' | 'CAUSE_TREE' | 'ICAM';

export type CauseLevel = 'IMMEDIATE' | 'ROOT' | 'SYSTEMIC';

export type ErrorNature = 'SLIP_LAPSE' | 'MISTAKE' | 'VIOLATION';

export type ViolationSubtype = 'ROUTINE' | 'EXCEPTIONAL';

export type JustCultureOutcome = 'HONEST_ERROR' | 'AT_RISK' | 'RECKLESS';

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─────────────────────────────────────────────────────────────────────────
//  DTO (miroir des DTO Java)
// ─────────────────────────────────────────────────────────────────────────

export interface ErrorEventDTO {
    id?: number | null;
    reference?: string | null;
    companyId?: number | null;
    eventTypeId?: number | null;
    title?: string | null;
    description?: string | null;
    /** LocalDateTime ISO sans timezone : "2026-06-17T14:30:00". */
    occurredAt?: string | null;
    declaredAt?: string | null;
    declaredBy?: number | null;
    isAnonymous?: boolean;
    zoneId?: number | null;
    actualSeverityId?: number | null;
    potentialSeverityId?: number | null;
    probabilityId?: number | null;
    criticalityLevel?: CriticalityLevel | null;
    isHipo?: boolean;
    status?: ErrorEventStatus | null;
    sourceModule?: ErrorSourceModule | null;
    linkedIncidentId?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ErrorClassificationDTO {
    id?: number | null;
    errorEventId?: number | null;
    errorNature?: ErrorNature | null;
    violationSubtype?: ViolationSubtype | null;
    isLatent?: boolean;
    notes?: string | null;
}

export interface CausalAnalysisDTO {
    id?: number | null;
    errorEventId?: number | null;
    method: CausalMethod;
    summary?: string | null;
    conductedBy?: number | null;
    /** LocalDateTime ISO. */
    conductedAt?: string | null;
}

export interface CauseDTO {
    id?: number | null;
    causalAnalysisId?: number | null;
    label: string;
    level?: CauseLevel | null;
    category?: string | null;
    parentCauseId?: number | null;
}

export interface JustCultureAssessmentDTO {
    id?: number | null;
    errorEventId?: number | null;
    outcome?: JustCultureOutcome | null;
    substitutionTest?: string | null;
    decisionNotes?: string | null;
    assessedBy?: number | null;
    /** LocalDateTime ISO. */
    assessedAt?: string | null;
}

export interface ErrorEventHistoryDTO {
    id?: number | null;
    errorEventId?: number | null;
    fromStatus?: ErrorEventStatus | null;
    toStatus?: ErrorEventStatus | null;
    action?: string | null;
    actorId?: number | null;
    actorLabel?: string | null;
    comment?: string | null;
    /** LocalDateTime ISO. */
    timestamp?: string | null;
}

export interface StatusUpdateRequest {
    toStatus: ErrorEventStatus;
    actorId?: number | null;
    actorLabel?: string | null;
    comment?: string | null;
}

export interface RecurrentCause {
    label: string;
    occurrences: number;
}

export interface ErrorKpiDTO {
    total: number;
    countByStatus: Record<string, number>;
    countByEventType: Record<string, number>;
    countByCriticality: Record<string, number>;
    hipoCount: number;
    nearMissCount: number;
    accidentCount: number;
    nearMissAccidentRatio: number;
    overdueCapa: number;
    recurrentCauses: RecurrentCause[];
    maturityProxy: number;
}

// ─── Référentiels (entités JPA exposées telles quelles côté API) ───

export interface ErrorEventType {
    id: number;
    companyId?: number | null;
    code?: string | null;
    label?: string | null;
    colorHex?: string | null;
    active?: boolean;
}

export interface ErrorSeverity {
    id: number;
    level?: number | null;
    label?: string | null;
    colorHex?: string | null;
}

export interface ErrorProbability {
    id: number;
    level?: number | null;
    label?: string | null;
}

export interface ErrorCriticalityMatrixCell {
    id: number;
    severityLevel?: number | null;
    probabilityLevel?: number | null;
    criticalityLevel?: CriticalityLevel | null;
    colorHex?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
//  ÉVÉNEMENTS
// ─────────────────────────────────────────────────────────────────────────

export interface ListEventsParams {
    status?: ErrorEventStatus | null;
    eventTypeId?: number | null;
}

const listEvents = async (params?: ListEventsParams): Promise<ErrorEventDTO[]> => {
    const query: Record<string, unknown> = {};
    if (params?.status) query.status = params.status;
    if (params?.eventTypeId != null) query.eventTypeId = params.eventTypeId;
    const res = await axiosInstance.get('/hns/error/events', {
        params: query,
        timeout: ERROR_MANAGEMENT_READ_TIMEOUT_MS,
    });
    return res.data ?? [];
};

const getEvent = async (id: number): Promise<ErrorEventDTO> => {
    const res = await axiosInstance.get(`/hns/error/events/${id}`);
    return res.data;
};

const createEvent = async (dto: ErrorEventDTO): Promise<ErrorEventDTO> => {
    const res = await axiosInstance.post('/hns/error/events', dto);
    return res.data;
};

const updateStatus = async (id: number, body: StatusUpdateRequest): Promise<ErrorEventDTO> => {
    const res = await axiosInstance.put(`/hns/error/events/${id}/status`, body);
    return res.data;
};

const getHistory = async (id: number): Promise<ErrorEventHistoryDTO[]> => {
    const res = await axiosInstance.get(`/hns/error/events/${id}/history`);
    return res.data ?? [];
};

// ─────────────────────────────────────────────────────────────────────────
//  CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────

const getClassification = async (id: number): Promise<ErrorClassificationDTO | null> => {
    const res = await axiosInstance.get(`/hns/error/events/${id}/classification`);
    return res.data ?? null;
};

const upsertClassification = async (
    id: number,
    dto: ErrorClassificationDTO,
): Promise<ErrorClassificationDTO> => {
    const res = await axiosInstance.put(`/hns/error/events/${id}/classification`, dto);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
//  ANALYSES CAUSALES + CAUSES
// ─────────────────────────────────────────────────────────────────────────

const listCausalAnalyses = async (id: number): Promise<CausalAnalysisDTO[]> => {
    const res = await axiosInstance.get(`/hns/error/events/${id}/causal-analyses`);
    return res.data ?? [];
};

const addCausalAnalysis = async (
    id: number,
    dto: CausalAnalysisDTO,
): Promise<CausalAnalysisDTO> => {
    const res = await axiosInstance.post(`/hns/error/events/${id}/causal-analyses`, dto);
    return res.data;
};

const listCauses = async (analysisId: number): Promise<CauseDTO[]> => {
    const res = await axiosInstance.get(`/hns/error/causal-analyses/${analysisId}/causes`);
    return res.data ?? [];
};

const addCause = async (analysisId: number, dto: CauseDTO): Promise<CauseDTO> => {
    const res = await axiosInstance.post(`/hns/error/causal-analyses/${analysisId}/causes`, dto);
    return res.data;
};

const deleteCause = async (causeId: number): Promise<void> => {
    await axiosInstance.delete(`/hns/error/causes/${causeId}`);
};

// ─────────────────────────────────────────────────────────────────────────
//  CULTURE JUSTE (JUST CULTURE)
// ─────────────────────────────────────────────────────────────────────────

const getJustCulture = async (id: number): Promise<JustCultureAssessmentDTO | null> => {
    const res = await axiosInstance.get(`/hns/error/events/${id}/just-culture`);
    return res.data ?? null;
};

const upsertJustCulture = async (
    id: number,
    dto: JustCultureAssessmentDTO,
): Promise<JustCultureAssessmentDTO> => {
    const res = await axiosInstance.put(`/hns/error/events/${id}/just-culture`, dto);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
//  KPI
// ─────────────────────────────────────────────────────────────────────────

const getKpis = async (): Promise<ErrorKpiDTO> => {
    const res = await axiosInstance.get('/hns/error/kpis', { timeout: ERROR_MANAGEMENT_READ_TIMEOUT_MS });
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────
//  RÉFÉRENTIELS
// ─────────────────────────────────────────────────────────────────────────

const listEventTypes = async (): Promise<ErrorEventType[]> => {
    const res = await axiosInstance.get('/hns/error/referentials/event-types', {
        timeout: ERROR_MANAGEMENT_READ_TIMEOUT_MS,
    });
    return res.data ?? [];
};

const listSeverities = async (): Promise<ErrorSeverity[]> => {
    const res = await axiosInstance.get('/hns/error/referentials/severities');
    return res.data ?? [];
};

const listProbabilities = async (): Promise<ErrorProbability[]> => {
    const res = await axiosInstance.get('/hns/error/referentials/probabilities');
    return res.data ?? [];
};

const listCriticalityMatrix = async (): Promise<ErrorCriticalityMatrixCell[]> => {
    const res = await axiosInstance.get('/hns/error/referentials/criticality-matrix', {
        timeout: ERROR_MANAGEMENT_READ_TIMEOUT_MS,
    });
    return res.data ?? [];
};

// ─────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convertit une Date locale en chaîne ISO LocalDateTime sans timezone
 * (format attendu par Jackson côté backend : "2026-06-17T14:30:00").
 */
export const toLocalDateTime = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
};

/**
 * Résout le niveau de criticité depuis la matrice 5×5, à partir des niveaux
 * de gravité et de probabilité (1..5). Retourne la cellule complète ou null.
 */
export const resolveCriticalityCell = (
    matrix: ErrorCriticalityMatrixCell[],
    severityLevel: number | null | undefined,
    probabilityLevel: number | null | undefined,
): ErrorCriticalityMatrixCell | null => {
    if (severityLevel == null || probabilityLevel == null) return null;
    return (
        matrix.find(
            (c) => c.severityLevel === severityLevel && c.probabilityLevel === probabilityLevel,
        ) ?? null
    );
};

export {
    // événements
    listEvents,
    getEvent,
    createEvent,
    updateStatus,
    getHistory,
    // classification
    getClassification,
    upsertClassification,
    // analyses causales + causes
    listCausalAnalyses,
    addCausalAnalysis,
    listCauses,
    addCause,
    deleteCause,
    // culture juste
    getJustCulture,
    upsertJustCulture,
    // kpi
    getKpis,
    // référentiels
    listEventTypes,
    listSeverities,
    listProbabilities,
    listCriticalityMatrix,
};
