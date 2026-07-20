/**
 * InspectionService — Module Inspections HSE (refonte 2026-06).
 *
 * Service axios pour la nouvelle architecture template-driven du module
 * Inspections (cf. InspectionWorkflowController + InspectionTemplateController
 * cote backend).
 *
 * Endpoints exposes :
 *   /hns/inspection-template/*  -> bibliotheque de modeles reutilisables
 *   /hns/inspection/*           -> workflow (schedule, execute, validate, archive)
 *
 * Pattern aligne sur BlastService.tsx :
 *   - companyId injecte automatiquement en query param via AxiosInterceptor
 *   - X-User-Id renseigne par le wrapper sur les ecritures (audit)
 *   - withCredentials : cookies HttpOnly pour authentification
 */

import axiosInstance from '../interceptors/AxiosInterceptor';
import store from '../Store';

// ─────────────────────────────────────────────────────────────────────────────
//  Types contractuels (alignes sur les DTOs backend)
// ─────────────────────────────────────────────────────────────────────────────

export type InspectionTemplateType = 'EQUIPMENT' | 'LOCATION' | 'PROCEDURE';

export type CheckpointResponseType =
    | 'BOOLEAN'
    | 'NUMERIC_RANGE'
    | 'VISUAL_GRADE'
    | 'PHOTO_REQUIRED'
    | 'FREE_TEXT';

export type FindingConformity = 'CONFORM' | 'WATCH' | 'NON_CONFORM' | 'NOT_APPLICABLE';

export type InspectionStatus =
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'ARCHIVED'
    | 'REJECTED'
    // Statuts legacy (back-compat ; les inspections historiques peuvent les avoir)
    | 'PENDING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface InspectionCheckpointDTO {
    id?: number;
    label: string;
    helpText?: string;
    responseType: CheckpointResponseType;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    expectedValue?: string;
    displayOrder?: number;
    critical?: boolean;
    required?: boolean;
}

export interface InspectionTemplateDTO {
    id?: number;
    code: string;
    name: string;
    description?: string;
    type: InspectionTemplateType;
    scopeRef?: string;
    estimatedDurationMin?: number;
    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
    active?: boolean;
    checkpoints: InspectionCheckpointDTO[];
}

export interface InspectionTemplateSummaryDTO {
    id: number;
    code: string;
    name: string;
    type: InspectionTemplateType;
    scopeRef?: string;
    estimatedDurationMin?: number;
    checkpointCount: number;
    active: boolean;
    /** true = modèle du catalogue GLOBAL (partagé, non éditable depuis une mine). */
    global?: boolean;
}

/**
 * Rôles au sein d'une équipe d'inspection (D4). Invariant métier : une équipe
 * comporte EXACTEMENT un membre `LEAD` — c'est lui qui alimente
 * `primaryInspectorId` (rétro-compat : `start()` et le PDF s'en servent).
 */
export type InspectionRole = 'LEAD' | 'INSPECTOR' | 'SPECIALIST' | 'EQUIPMENT_OWNER' | 'OBSERVER';

export interface InspectionTeamMemberDTO {
    id?: number;
    employeeId: number;
    role: InspectionRole;
}

export interface ScheduleInspectionDTO {
    templateId: number;
    siteId?: number | null;
    targetRefId: number;
    targetLabel: string;
    plannedDate: string;        // ISO YYYY-MM-DD
    startTime?: string | null;  // ISO HH:mm:ss
    endTime?: string | null;
    description?: string;
    objectives?: string;
    primaryInspectorId?: number | null;
    /** Équipe d'inspection (D4). Null/vide toléré par le backend. */
    teamMembers?: InspectionTeamMemberDTO[];
    /**
     * Points de contrôle retenus (personnalisation à la planification). Chaque id
     * appartient au template. Null/vide = tous les points du modèle.
     */
    checkpointIds?: number[];
}

export interface LastInspectionDTO {
    id: number;
    plannedDate: string;
    status: InspectionStatus;
    primaryInspectorName?: string;
    templateName?: string;
}

export interface FindingDTO {
    id?: number;
    checkpointId?: number;
    rawValue?: string;
    conformity?: FindingConformity;
    note?: string;
    photoIds?: string;
    recordedBy?: number;
    recordedAt?: string;
    overrideReason?: string;
    // Champs en lecture seule renvoyes par le service
    checkpointLabel?: string;
    responseType?: CheckpointResponseType;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    critical?: boolean;
    helpText?: string;
    displayOrder?: number;
}

export interface ApprovalDTO {
    id?: number;
    approverId?: number;
    decision: 'APPROVE' | 'REJECT';
    comment?: string;
    decidedAt?: string;
    approverName?: string;
}

export interface InspectionSummaryDTO {
    id: number;
    plannedDate: string;
    startTime?: string;
    status: InspectionStatus;
    templateCode?: string;
    templateName?: string;
    templateType?: InspectionTemplateType;
    targetLabel?: string;
    siteName?: string;
    primaryInspectorId?: number;
    submittedAt?: string;
    archivedAt?: string;
    totalCheckpoints: number;
    findingsRecorded: number;
    nonConformCount: number;
}

export interface InspectionDetailDTO {
    id: number;
    activityId?: number;
    activityTitle?: string;
    siteId?: number;
    siteName?: string;
    plannedDate?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    objectives?: string;
    status: InspectionStatus;
    createdAt?: string;
    updatedAt?: string;
    templateId?: number;
    templateCode?: string;
    templateName?: string;
    templateType?: InspectionTemplateType;
    targetRefId?: number;
    targetLabel?: string;
    submittedAt?: string;
    approvedAt?: string;
    archivedAt?: string;
    primaryInspectorId?: number;
    primaryInspectorName?: string;
    summaryReport?: string;
    totalCheckpoints: number;
    findingsRecorded: number;
    nonConformCount: number;
    watchCount: number;
    criticalNonConformCount: number;
    findings: FindingDTO[];
    approvals: ApprovalDTO[];
    /**
     * Équipe d'inspection (employé + rôle). Optionnel : les inspections
     * ANTÉRIEURES à la réforme n'en ont pas — seul `primaryInspectorId` est
     * renseigné. Les consommateurs doivent tolérer une liste vide.
     */
    teamMembers?: InspectionTeamMemberDTO[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const resolveUserId = (): number | null => {
    try {
        const state: any = store.getState();
        return state.user?.empId ?? state.user?.id ?? null;
    } catch (_e) {
        return null;
    }
};

const writeHeaders = () => {
    const userId = resolveUserId();
    return userId ? { 'X-User-Id': String(userId) } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
//  API : Templates
// ─────────────────────────────────────────────────────────────────────────────

export const listTemplates = (type?: InspectionTemplateType, includeInactive = false) => {
    const params: Record<string, unknown> = {};
    if (type) params.type = type;
    if (includeInactive) params.includeInactive = true;
    return axiosInstance
        .get<InspectionTemplateSummaryDTO[]>('/hns/inspection-template/list', { params })
        .then((r) => r.data);
};

export const getTemplate = (id: number) =>
    axiosInstance
        .get<InspectionTemplateDTO>(`/hns/inspection-template/${id}`)
        .then((r) => r.data);

export const createTemplate = (dto: InspectionTemplateDTO) =>
    axiosInstance
        .post<number>('/hns/inspection-template/create', dto, { headers: writeHeaders() })
        .then((r) => r.data);

export const updateTemplate = (id: number, dto: InspectionTemplateDTO) =>
    axiosInstance
        .put(`/hns/inspection-template/${id}`, dto, { headers: writeHeaders() })
        .then((r) => r.data);

export const deactivateTemplate = (id: number) =>
    axiosInstance
        .delete(`/hns/inspection-template/${id}`, { headers: writeHeaders() })
        .then((r) => r.data);

export const activateTemplate = (id: number) =>
    axiosInstance
        .post(`/hns/inspection-template/${id}/activate`, null, { headers: writeHeaders() })
        .then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  API : Workflow
// ─────────────────────────────────────────────────────────────────────────────

export const listInspections = () =>
    axiosInstance
        .get<InspectionSummaryDTO[]>('/hns/inspection/list')
        .then((r) => r.data);

export const getInspection = (id: number) =>
    axiosInstance
        .get<InspectionDetailDTO>(`/hns/inspection/${id}`)
        .then((r) => r.data);

/**
 * Dernière inspection pour une cible donnée (type + targetRefId), scopée mine
 * (companyId injecté par l'intercepteur). Renvoie `null` si aucune inspection
 * précédente (backend 204/null) ou en cas d'erreur — le panneau d'info du
 * formulaire de planification dégrade alors gracieusement.
 */
export const getLastInspection = (
    targetType: InspectionTemplateType,
    targetRefId: number,
): Promise<LastInspectionDTO | null> =>
    axiosInstance
        .get<LastInspectionDTO>('/hns/inspections/last', {
            params: { targetType, targetRefId },
        })
        .then((r) => (r.data && (r.data as any).id ? r.data : null))
        .catch(() => null);

/**
 * Planifie une inspection. `companyId` (optionnel) force la mine propriétaire :
 * indispensable en vue consolidée (« Toutes les Mines ») où l'intercepteur
 * n'injecte aucun companyId — on file alors l'inspection sous la mine de la
 * cible sélectionnée. Fourni explicitement, il court-circuite l'intercepteur.
 */
export const scheduleInspection = (dto: ScheduleInspectionDTO, companyId?: number | null) => {
    // On n'envoie companyId QUE s'il désigne une mine précise (> 0). Un 0 (ou une
    // valeur nulle/NaN) = « vue consolidée / aucune mine » : on omet alors le
    // paramètre, et le serveur dérive la mine depuis la cible. Envoyer companyId=0
    // était rejeté en 403 par le cloisonnement (sentinelle empoisonnée).
    const scoped = typeof companyId === 'number' && Number.isFinite(companyId) && companyId > 0;
    return axiosInstance
        .post<number>('/hns/inspection/schedule', dto, {
            headers: writeHeaders(),
            ...(scoped ? { params: { companyId } } : {}),
        })
        .then((r) => r.data);
};

/**
 * Remplace l'équipe d'une inspection DÉJÀ PLANIFIÉE (employés + rôles).
 *
 * Sémantique de REMPLACEMENT intégral : envoyer l'état complet du tableau.
 * Une liste vide vide l'équipe (et l'inspecteur principal). Le serveur applique
 * les mêmes invariants qu'à la planification (exactement un LEAD, pas de
 * doublon d'employé) et refuse après approbation/archivage (rapport figé).
 */
export const updateInspectionTeam = (id: number, members: InspectionTeamMemberDTO[]) =>
    axiosInstance
        .put(`/hns/inspection/${id}/team`, members, { headers: writeHeaders() })
        .then((r) => r.data);

export const startInspection = (id: number) =>
    axiosInstance
        .post(`/hns/inspection/${id}/start`, null, { headers: writeHeaders() })
        .then((r) => r.data);

export const saveFindingsBatch = (id: number, findings: FindingDTO[]) =>
    axiosInstance
        .post(`/hns/inspection/${id}/findings/batch`, findings, { headers: writeHeaders() })
        .then((r) => r.data);

export const updateSummary = (id: number, summary: string) =>
    axiosInstance
        .put(`/hns/inspection/${id}/summary`, { summary }, { headers: writeHeaders() })
        .then((r) => r.data);

export const submitInspection = (id: number) =>
    axiosInstance
        .post(`/hns/inspection/${id}/submit`, null, { headers: writeHeaders() })
        .then((r) => r.data);

export const decideInspection = (
    id: number,
    dto: ApprovalDTO,
    expectedApprovers: number = 1,
) =>
    axiosInstance
        .post(`/hns/inspection/${id}/decide`, dto, {
            headers: writeHeaders(),
            params: { expectedApprovers },
        })
        .then((r) => r.data);
